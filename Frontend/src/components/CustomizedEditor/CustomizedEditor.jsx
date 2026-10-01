import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { LAYOUT_DEFAULT_COLORS } from './Layout';
import { useParams, useOutletContext, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Sidebar from './Sidebar';
import PreviewArea from './PreviewArea';
import Branding from './Branding';
import Appearance from './Appearance';
import MenuBar from './MenuBar';
import OtherSetup from './OtherSetup';
import LeadForm from './LeadForm';
import Visibility from './Visibility';
import Statistic from './Statistic';
import FlipbookPreview from '../TemplateEditor/FlipbookPreview.jsx';
import { getFromDB, saveToDB } from '../../utils/dbUtils';
import { getDominantColors, REACT_BITS_THEMES_COLORS } from '../../utils/colorExtractor';
import { getSupabaseBaseUrl } from '../../utils/supabaseUtils';


// Helper functions for color synchronization (matching Layout.jsx logic)
const getTint = (hex, weight = 0.8) => {
  let r = parseInt(hex.slice(1, 3), 16); let g = parseInt(hex.slice(3, 5), 16); let b = parseInt(hex.slice(5, 7), 16);
  r = Math.round(r + (255 - r) * weight); g = Math.round(g + (255 - g) * weight); b = Math.round(b + (255 - b) * weight);
  const toHex = x => x.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
};

const getShade = (hex, weight = 0.6) => {
  if (!hex || hex === 'transparent') return hex;
  let c = hex.substring(1).toUpperCase();
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  if (c.length !== 6) return hex;
  let r = parseInt(c.slice(0, 2), 16); let g = parseInt(c.slice(2, 4), 16); let b = parseInt(c.slice(4, 6), 16);
  r = Math.round(r * (1 - weight)); g = Math.round(g * (1 - weight)); b = Math.round(b * (1 - weight));
  const toHex = x => x.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
};

const isLightColor = (hex) => {
  if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return false;
  let c = hex.substring(1).toUpperCase();
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  if (c.length !== 6) return false;
  const r = parseInt(c.substring(0, 2), 16); const g = parseInt(c.substring(2, 4), 16); const b = parseInt(c.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.7;
};

const ensureDarkText = (hex) => {
  if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return hex;
  let c = hex.substring(1).toUpperCase();
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  if (c.length !== 6) return hex;
  const r = parseInt(c.substring(0, 2), 16); const g = parseInt(c.substring(2, 4), 16); const b = parseInt(c.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  if (luminance > 0.45) return getShade(hex, 0.5);
  return hex;
};
// Navbar removed

const createDefaultPageData = (name, w = 210, h = 297) => {
  const baseWidth = w;
  const baseHeight = h;
  const rootId = `g-${Math.random().toString(36).substr(2, 9)}`;
  const overlayId = `rect-${Math.random().toString(36).substr(2, 9)}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${baseWidth} ${baseHeight}" width="100%" height="100%" style="overflow: visible">
  <g id="${rootId}" data-name="${name}" data-type="frame">
    <rect id="${overlayId}" x="0" y="0" width="${baseWidth}" height="${baseHeight}" fill="#ffffff" data-name="Overlay" data-type="background" data-locked="true" shape-rendering="crispEdges" />
  </g>
</svg>`;
};

const CustomizedEditor = () => {
  const { folder, v_id, page } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { setExportHandler, setSaveHandler, setPreviewHandler, setClearHandler, setHasUnsavedChanges, hasUnsavedChanges, triggerSaveSuccess, isAutoSaveEnabled, currentBook, setCurrentBook, activeDevice, setActiveDevice } = useOutletContext() || {};
  const [bookName, setBookName] = useState(() => currentBook?.flipbookName || 'Name of the Book');
  const [activeSubView, setActiveSubView] = useState(null);
  const [otherSetupTarget, setOtherSetupTarget] = useState(null);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [pages, setPages] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [devicePages, setDevicePages] = useState({ Desktop: 0, Tablet: 0, Mobile: 0 });
  const targetPage = devicePages[activeDevice || 'Desktop'] || 0;
  const setTargetPage = useCallback((pageNum) => {
    setDevicePages(prev => ({
      ...prev,
      [activeDevice || 'Desktop']: pageNum
    }));
  }, [activeDevice]);
  const [projectBaseUrl, setProjectBaseUrl] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Reset collapsed state whenever a new sub-view is selected
  useEffect(() => {
    setIsPanelCollapsed(false);
  }, [activeSubView]);

  const profilePreviewForcedRef = useRef(false);

  useEffect(() => {
    const shouldBeOpen = activeSubView === 'profile' && !isPanelCollapsed;
    
    if (shouldBeOpen && !profilePreviewForcedRef.current) {
      window.dispatchEvent(new Event('open-profile-preview'));
      profilePreviewForcedRef.current = true;
    } else if (!shouldBeOpen && profilePreviewForcedRef.current) {
      window.dispatchEvent(new Event('close-profile-preview'));
      profilePreviewForcedRef.current = false;
    }
  }, [activeSubView, isPanelCollapsed]);

  // Handle initial page from URL
  useEffect(() => {
    if (page) {
      const pageNum = parseInt(page);
      if (!isNaN(pageNum)) {
        setTargetPage(pageNum);
      }
    }
  }, [page]);

  // Update URL when page changes to maintain state on refresh
  useEffect(() => {
    if (folder && v_id) {
      // Use replace: true to avoid cluttering history with every page turn
      navigate(`/editor/customized_editor/${encodeURIComponent(folder)}/${v_id}/${targetPage}`, { replace: true });
    }
  }, [targetPage, folder, v_id, navigate]);

  // Sync with global flipbook name from context (Template Editor sync)
  useEffect(() => {
    if (currentBook?.flipbookName && currentBook.flipbookName !== bookName) {
      setBookName(currentBook.flipbookName || 'Name of the Book');
    }
  }, [currentBook?.flipbookName]);

  // Navbar States handled by context
  const [saveSuccessInfo, setSaveSuccessInfo] = useState(null);

  // Customization States
  // Customization States (Loaded from currentBook/location.state synchronously, then updated via DB API)
  const [logoSettings, setLogoSettings] = useState(() => {
    const cb = currentBook?.Customized_Settings?.Branding || currentBook?.settings?.Branding || currentBook?.settings || {};
    const l = cb.logoSettings || cb.logo || location.state?.logoSettings || location.state?.logo;
    if (l && typeof l === 'object') return l;
    return {
      src: '',
      url: '',
      type: 'Fit',
      opacity: 100,
      adjustments: { exposure: 0, contrast: 0, saturation: 0, temperature: 0, tint: 0, highlights: 0, shadows: 0 }
    };
  });

  const [watermarkSettings, setWatermarkSettings] = useState(() => {
    const cb = currentBook?.Customized_Settings?.Branding || currentBook?.settings?.Branding || currentBook?.settings || {};
    const w = cb.watermarkSettings || cb.watermark || location.state?.watermarkSettings || location.state?.watermark;
    if (w && typeof w === 'object') return { ...w, src: w.src || '' };
    return {
      src: '',
      opacity: 64,
      position: 'Bottom Right'
    };
  });

  const [preloaderSettings, setPreloaderSettings] = useState(() => {
    const cb = currentBook?.Customized_Settings?.Branding || currentBook?.settings?.Branding || currentBook?.settings || {};
    const p = cb.preloaderSettings || cb.preloader || location.state?.preloaderSettings || location.state?.preloader;
    if (p && typeof p === 'object' && Object.keys(p).length > 0) return p;

    return {};
  });

  const [profileSettings, setProfileSettings] = useState(() => {
    const cb = currentBook?.Customized_Settings?.Branding || currentBook?.settings?.Branding || currentBook?.settings || {};
    const pr = cb.profileSettings || cb.profile || location.state?.profileSettings || location.state?.profile;
    if (pr && typeof pr === 'object') return pr;
    return {
      name: '',
      about: '',
      contacts: [
        { id: '1', type: 'email', value: '' },
        { id: '2', type: 'phone', value: '' }
      ]
    };
  });

  const [backgroundSettings, setBackgroundSettings] = useState(() => {
    const bg = currentBook?.Customized_Settings?.Background || currentBook?.settings?.Background || location.state?.backgroundSettings || location.state?.background;
    if (bg && typeof bg === 'object') {
      let finalBg = { ...bg, applyDynamicColor: bg.applyDynamicColor ?? true };
      if (finalBg.color === '#DADBE8' || finalBg.color === '#E2E4F0' || finalBg.color === '#dadbe8' || finalBg.color === '#e2e4f0') {
        finalBg.color = '#D9D9D9';
      }
      return finalBg;
    }
    return {
      color: '#D9D9D9',
      style: 'Solid',
      gradient: 'linear-gradient(to bottom, #b363f1ff, #a855f7)',
      image: '',
      fit: 'Cover',
      opacity: 100,
      animation: 'None',
      reactBitType: null,
      applyDynamicColor: true
    };
  });

  const [bookAppearanceSettings, setBookAppearanceSettings] = useState(() => {
    const app = currentBook?.Customized_Settings?.BookAppearance || currentBook?.settings?.BookAppearance || location.state?.bookAppearanceSettings || location.state?.appearance;
    if (app && typeof app === 'object') return app;
    return {
      texture: 'Plain White',
      hardCover: false,
      grainIntensity: 20,
      warmth: 0,
      textureScale: 0,
      opacity: 100,
      flipStyle: 'Classic Flip',
      flipSpeed: 'medium',
      corner: 'Sharp',
      dropShadow: {
        active: true,
        color: '#4f4f4fff',
        opacity: 50,
        xAxis: 0,
        yAxis: 0,
        blur: 0,
        spread: 0
      },
      instructions: 'first'
    };
  });

  const [layoutSettings, setLayoutSettings] = useState(() => {
    const lStyle = currentBook?.Customized_Settings?.Layouts?.layoutStyle || currentBook?.settings?.Layouts?.layoutStyle || location.state?.layoutSettings;
    return lStyle !== undefined ? lStyle : 1;
  });

  const [layoutColors, setLayoutColors] = useState(() => {
    const lColors = currentBook?.Customized_Settings?.Layouts?.layoutColors || currentBook?.settings?.Layouts?.layoutColors || location.state?.layoutColors;
    return (lColors && typeof lColors === 'object') ? lColors : {};
  });

  // Track background changes to trigger color extraction
  const prevBackgroundRef = useRef({
    style: backgroundSettings.style,
    image: backgroundSettings.image,
    video: backgroundSettings.video,
    reactBitType: backgroundSettings.reactBitType,
    applyDynamicColor: backgroundSettings.applyDynamicColor
  });

  useEffect(() => {
    const { style, image, video, media, reactBitType, applyDynamicColor } = backgroundSettings;
    const isDynamicEnabled = applyDynamicColor !== false;
    const activeImage = image || media;
    const activeVideo = video || media || image;
    const prev = prevBackgroundRef.current;

    // Only trigger if the background source actually changed or the toggle changed
    const sourceChanged = (style !== prev.style) || (image !== prev.image) || (video !== prev.video) || (reactBitType !== prev.reactBitType);
    const toggleChanged = (isDynamicEnabled !== prev.applyDynamicColor);

    if (sourceChanged || toggleChanged) {
      prevBackgroundRef.current = { style, image, video, reactBitType, applyDynamicColor: isDynamicEnabled };

      const isThemeActive = style === 'ReactBits' || style === 'Image' || style === 'Video' || style === 'Media';

      if (!isDynamicEnabled || !isThemeActive) {
        setLayoutColors(prevColors => {
          const updated = { ...prevColors };
          for (let i = 1; i <= 9; i++) {
            updated[i] = [...(LAYOUT_DEFAULT_COLORS[i] || [])];
          }
          delete updated.toolbarColor;
          delete updated.popupColor;
          if (v_id) {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
              try {
                const user = JSON.parse(storedUser);
                const userEmail = user?.emailId || user?.email;
                if (userEmail) {
                  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
                  axios.post(`${backendUrl}/api/flipbook/update-settings`, {
                    emailId: userEmail,
                    v_id: v_id,
                    folderName: folder || 'Recent Book',
                    bookName: bookNameRef.current || bookName,
                    Background: backgroundSettings,
                    Layouts: {
                      layoutStyle: layoutSettings,
                      layoutColors: updated
                    }
                  }).catch(err => console.warn("Reset layout colors DB save warning:", err));
                }
              } catch (e) {
                console.error("Error saving reset layout colors to DB", e);
              }
            }
          }
          return updated;
        });
        return;
      }

      const applyExtractedColors = async () => {
        let extracted = null;
        if (style === 'ReactBits' && reactBitType) {
          extracted = REACT_BITS_THEMES_COLORS[reactBitType];
        } else if (activeImage) {
          extracted = await getDominantColors(activeImage, false);
        } else if (activeVideo) {
          extracted = await getDominantColors(activeVideo, true);
        }

        if (extracted) {
          const { dark, light } = extracted;

          setLayoutColors(prevColors => {
            const updated = { ...prevColors };

            // Apply to all 9 layouts
            for (let i = 1; i <= 9; i++) {
              const defaults = LAYOUT_DEFAULT_COLORS[i] || [];
              const current = updated[i] || [];

              // Ensure we have a complete list of colors based on defaults
              let layoutColorsList = defaults.map(d => {
                const s = current.find(c => c.id === d.id);
                return s ? { ...s } : { ...d };
              });

              const primaryIds = ['toolbar-bg', 'bottom-toolbar-bg', 'page-number-bg', 'toc-bg', 'dropdown-bg', 'thumbnail-outer-v2', 'thumbnail-inner-v2', 'toc-overlay'];
              const secondaryIds = ['toolbar-text-main', 'toolbar-icon', 'toc-text', 'dropdown-text', 'dropdown-icon', 'toc-icon', 'page-number-text'];
              const shadeIds = ['search-bg-v1', 'search-bg-v2', 'reset-bg'];

              layoutColorsList = layoutColorsList.map(c => {
                if (primaryIds.includes(c.id)) return { ...c, hex: dark };
                if (secondaryIds.includes(c.id)) {
                  let targetHex = light;
                  let targetOpacity = c.opacity;
                  return { ...c, hex: targetHex, opacity: targetOpacity };
                }
                if (shadeIds.includes(c.id)) return { ...c, hex: getTint(dark, 0.75) };

                if (c.id === 'search-text-v1') {
                  const isLightBar = isLightColor(dark);
                  return { ...c, hex: ensureDarkText(isLightBar ? light : dark), opacity: 100 };
                }

                return c;
              });

              updated[i] = layoutColorsList;
            }

            updated.toolbarColor = {
              primary: dark,
              secondary: light
            };
            updated.popupColor = {
              primary: dark,
              secondary: light
            };

            if (v_id) {
              const storedUser = localStorage.getItem('user');
              if (storedUser) {
                try {
                  const user = JSON.parse(storedUser);
                  const userEmail = user?.emailId || user?.email;
                  if (userEmail) {
                    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
                    axios.post(`${backendUrl}/api/flipbook/update-settings`, {
                      emailId: userEmail,
                      v_id: v_id,
                      folderName: folder || 'Recent Book',
                      bookName: bookNameRef.current || bookName,
                      Background: backgroundSettings,
                      Layouts: {
                        layoutStyle: layoutSettings,
                        layoutColors: updated
                      }
                    }).catch(err => console.warn("Extracted layout colors DB save warning:", err));
                  }
                } catch (e) {
                  console.error("Error saving extracted layout colors to DB", e);
                }
              }
            }

            return updated;
          });
        }
      };

      applyExtractedColors();
    }
  }, [backgroundSettings.style, backgroundSettings.image, backgroundSettings.video, backgroundSettings.reactBitType, backgroundSettings.applyDynamicColor]);

  const defaultToc = {
    addSearch: true,
    addPageNumber: true,
    addSerialNumberHeading: true,
    addSerialNumberSubheading: true,
    content: []
  };
  const defaultBookmark = {
    icon: 'default',
    font: 'Poppins',
    color: '#C45A5A',
    shape: 1,
    style: 1,
    items: []
  };

  const [menuBarSettings, setMenuBarSettings] = useState({
    navigation: {
      nextPrevButtons: true,
      mouseWheel: false,
      dragToTurn: true,
      pageQuickAccess: true,
      tableOfContents: true,
      tocSettings: defaultToc,
      pageThumbnails: true,
      bookmark: false,
      bookmarkSettings: defaultBookmark,
      startEndNav: true,
    },
    viewing: {
      zoom: true,
      zoomSettings: {
        maximumZoom: 4,
        twoClickToZoom: true
      },
      fullScreen: true,
    },
    interaction: {
      search: true,
      notes: true,
      gallery: true,
      gallerySettings: {
        imageFitType: 'Fill All',
        images: [],
        transitionEffect: 'Linear',
        primaryColor: '#4F46E5',
        secondaryColor: '#9CA3AF',
        bgColor: '#FFFFFF',
        navigationIconType: 'Chevron',
        autoPlay: true,
        speed: 2,
        infiniteLoop: true,
        showDots: true
      }
    },
    media: {
      autoFlip: true,
      autoFlipSettings: {
        duration: 4,
        countdown: false
      },
      backgroundAudio: true,
      audio: true,
      audioSettings: {
        flipSound: 'Soft Paper Flip',
        pageSpecificSound: false,
        bgSound: 'BG Sound 1',
        bgSoundFile: '',
        customBgSounds: []
      }
    },
    shareExport: {
      share: true,
      download: true
    },
    brandingProfile: {
      logo: true,
      profile: true,
    },
    tocSettings: defaultToc
  });

  const [tocOpenTrigger, setTocOpenTrigger] = useState(0);

  const [otherSetupSettings, setOtherSetupSettings] = useState({
    toolbar: {
      displayMode: 'icon',
      addTextBelowIcons: false,
      addSearchOnTop: true,
      textProperties: { font: 'Poppins', fill: '#ffffffff', stroke: '#' },
      toolbarColor: { fill: '#3E4491', stroke: '#' },
      iconsColor: { fill: '#ffffff', stroke: '#' },
      processBar: { fill: '#ffffffff', stroke: '#' },
      autoFlipEnabled: false,
      autoFlipDuration: 2,
      addForwardFlipCountdownLine: true,
      nextFlipCountdown: true,
      maximumZoom: 1,
      twoClickToZoom: true,
    },
    sound: {
      flipSound: 'Soft Paper Flip',
      flipSoundEnabled: true,
      pageSpecificSound: false,
      bgSound: 'BG Sound 1',
      customBgSounds: [],
      bgSoundFile: null
    },
    gallery: {
      autoPlay: true,
      speed: 2,
      infiniteLoop: true,
      showDots: true,
      dotColor: '#4F46E5',
      imageFitType: 'Fill All',
      transitionEffect: 'Linear',
      dragToSlide: false,
      images: [],
    },
  });

  const [leadFormSettings, setLeadFormSettings] = useState({
    enabled: false,
    leadText: 'Share your information to get personalized updates.',
    fields: [
      { id: '1', type: 'name', placeholder: 'Enter your Name' },
      { id: '2', type: 'email', placeholder: 'Enter your Gmail' },
      { id: '3', type: 'feedback', placeholder: 'Enter your Feedback' }
    ],
    appearance: {
      timing: 'after-pages',
      afterPages: 4,
      allowSkip: true,
      fontStyle: 'Poppins',
      textFill: '#3E4491',
      textStroke: '',
      bgFill: '#ffffffff',
      bgStroke: '',
      btnFill: '#3E4491',
      btnStroke: '',
      btnText: 'white'
    }
  });

  const [visibilitySettings, setVisibilitySettings] = useState({
    type: 'Public',
    password: '',
    inviteOnly: {
      allowReAccess: true,
      notifyOnView: true,
      autoExpire: {
        enabled: false,
        duration: '0 Hr 5 Min'
      }
    }
  });

  const [shareSettings, setShareSettings] = useState({
    shareId: '',
    access: 'public'
  });

  // Keep menuBarSettings.media strictly in sync with otherSetupSettings.sound
  useEffect(() => {
    if (otherSetupSettings?.sound) {
      setMenuBarSettings(prev => {
        const curMedia = prev?.media || {};
        const curAudioSet = curMedia.audioSettings || {};
        const newAudioSet = otherSetupSettings.sound;
        if (
          curAudioSet.bgSound === newAudioSet.bgSound &&
          curAudioSet.bgSoundFile === newAudioSet.bgSoundFile &&
          curAudioSet.flipSound === newAudioSet.flipSound &&
          curAudioSet.pageSpecificSound === newAudioSet.pageSpecificSound &&
          curAudioSet.bgSoundEnabled === newAudioSet.bgSoundEnabled &&
          curAudioSet.flipSoundEnabled === newAudioSet.flipSoundEnabled
        ) {
          return prev;
        }

        return {
          ...(prev || {}),
          media: {
            ...curMedia,
            audioSettings: {
              ...curAudioSet,
              ...newAudioSet
            }
          }
        };
      });
    }
  }, [otherSetupSettings?.sound]);

  // Keep menuBarSettings.interaction.gallerySettings strictly in sync with otherSetupSettings.gallery
  useEffect(() => {
    if (otherSetupSettings?.gallery?.images) {
      setMenuBarSettings(prev => {
        const curInteraction = prev?.interaction || {};
        const curGallery = curInteraction.gallerySettings || {};
        const newImages = otherSetupSettings.gallery.images;

        if (JSON.stringify(curGallery.images) === JSON.stringify(newImages)) {
          return prev;
        }

        return {
          ...(prev || {}),
          interaction: {
            ...curInteraction,
            gallerySettings: {
              ...curGallery,
              images: newImages
            }
          }
        };
      });
    }
  }, [otherSetupSettings?.gallery?.images]);

  // Save Appearance Logic with Debounce
  useEffect(() => {
    if (!v_id || !isDataLoaded) return;

    const timer = setTimeout(() => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          const userEmail = user?.emailId || user?.email;
          if (!userEmail) return;
          const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
          
          axios.post(`${backendUrl}/api/flipbook/background`, {
            action: 'save',
            emailId: userEmail,
            v_id: v_id,
            folderName: folder || 'Recent Book',
            bookName: bookName,
            backgroundSettings
          }).catch(err => console.warn("Background API auto-save warning:", err));

          axios.post(`${backendUrl}/api/flipbook/update-settings`, {
            emailId: userEmail,
            v_id: v_id,
            folderName: folder || 'Recent Book',
            bookName: bookName,
            Background: backgroundSettings,
            Layouts: {
              layoutStyle: layoutSettings,
              layoutColors: layoutColors
            },
            settings: {
              background: backgroundSettings,
              appearance: bookAppearanceSettings,
              layout: layoutSettings,
              layoutColors: layoutColors
            }
          }).catch(err => console.warn("Appearance/Background auto-save warning:", err));
        } catch (e) {
          console.error("User parse error in background auto-save", e);
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [backgroundSettings, bookAppearanceSettings, layoutSettings, layoutColors, v_id, isDataLoaded, folder]);

  const bookNameRef = useRef(bookName);
  bookNameRef.current = bookName;

  // Save Setup Logic with Debounce
  useEffect(() => {
    if (!v_id || !isDataLoaded) return;

    const timer = setTimeout(() => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          const userEmail = user?.emailId || user?.email;
          if (!userEmail) return;
          const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
          const updatedShare = {
            ...(shareSettings || {}),
            access: visibilitySettings?.type || 'Public',
            password: visibilitySettings?.password || '',
            accessKey: visibilitySettings?.accessKey || '',
            isPasswordSaved: Boolean(visibilitySettings?.isPasswordSaved),
            inviteOnly: visibilitySettings?.inviteOnly || {}
          };
          axios.post(`${backendUrl}/api/flipbook/update-settings`, {
            emailId: userEmail,
            v_id: v_id,
            folderName: folder || 'Recent Book',
            bookName: v_id,
            newName: bookNameRef.current || currentBook?.flipbookName,
            share: updatedShare,
            MenuBar: menuBarSettings,
            otherSetup: otherSetupSettings,
            leadForm: leadFormSettings,
            settings: {
              menuBar: menuBarSettings,
              otherSetup: otherSetupSettings,
              visibility: visibilitySettings,
              leadForm: leadFormSettings
            }
          }).then((res) => {
            if (res.data?.share) {
              setShareSettings(prev => {
                if (JSON.stringify(prev) === JSON.stringify(res.data.share)) return prev;
                return res.data.share;
              });
            }
          }).catch(err => console.error("Visibility auto-save failed:", err));
        } catch (e) {
          console.error("User parse error in visibility auto-save", e);
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [menuBarSettings, otherSetupSettings, leadFormSettings, isDataLoaded, v_id, folder, shareSettings, visibilitySettings, currentBook]);

  // Save Branding Logic with Debounce
  useEffect(() => {
    if (!v_id || !isDataLoaded) return;

    const timer = setTimeout(() => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          const userEmail = user?.emailId || user?.email;
          if (!userEmail) return;
          const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

          axios.post(`${backendUrl}/api/flipbook/update-settings`, {
            emailId: userEmail,
            v_id: v_id,
            folderName: folder || 'Recent Book',
            bookName: bookNameRef.current || bookName,
            newName: bookNameRef.current || bookName,
            Branding: {
              logoSettings,
              watermarkSettings,
              preloaderSettings,
              profileSettings
            }
          }).catch(err => console.warn("Branding auto-save warning:", err));
        } catch (e) {
          console.error("User parse error in branding auto-save", e);
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [logoSettings, watermarkSettings, preloaderSettings, profileSettings, v_id, isDataLoaded, folder]);

  // Auto-save & Real-time preview sync for otherSetupSettings (Gallery, Slide Effect, Popup Customization, Controls, etc.)
  useEffect(() => {
    if (!isDataLoaded || !otherSetupSettings) return;

    // Real-time sync gallery to menuBarSettings for live preview
    if (otherSetupSettings.gallery) {
      setMenuBarSettings(prev => {
        const curGallery = prev?.interaction?.gallerySettings || {};
        const newGallery = otherSetupSettings.gallery;
        if (
          curGallery.primaryColor === newGallery.primaryColor &&
          curGallery.secondaryColor === newGallery.secondaryColor &&
          curGallery.bgColor === newGallery.bgColor &&
          curGallery.transitionEffect === newGallery.transitionEffect &&
          curGallery.speed === newGallery.speed &&
          curGallery.autoPlay === newGallery.autoPlay &&
          curGallery.autoSlide === newGallery.autoSlide &&
          curGallery.infiniteLoop === newGallery.infiniteLoop &&
          curGallery.showDots === newGallery.showDots &&
          curGallery.navStyle === newGallery.navStyle &&
          curGallery.images === newGallery.images
        ) {
          return prev;
        }
        return {
          ...prev,
          interaction: {
            ...prev?.interaction,
            gallerySettings: {
              ...curGallery,
              ...newGallery
            }
          }
        };
      });
    }

    // Debounced Auto-save to MongoDB
    const timer = setTimeout(() => {
      if (!v_id) return;
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return;
      try {
        const user = JSON.parse(storedUser);
        const userEmail = user?.emailId || user?.email;
        if (!userEmail) return;
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

        const mergedGallery = {
          ...(menuBarSettings?.interaction?.gallerySettings || {}),
          ...(otherSetupSettings?.gallery || {})
        };

        axios.post(`${backendUrl}/api/flipbook/update-settings`, {
          emailId: userEmail,
          v_id: v_id,
          folderName: folder || 'Recent Book',
          bookName: bookNameRef.current || bookName,
          otherSetup: {
            ...otherSetupSettings,
            gallery: mergedGallery
          },
          MenuBar: {
            ...menuBarSettings,
            interaction: {
              ...menuBarSettings?.interaction,
              gallerySettings: mergedGallery
            }
          }
        }).catch(err => console.warn("otherSetup auto-save warning:", err));
      } catch (e) {
        console.error("Auto-save error for otherSetup", e);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [otherSetupSettings, isDataLoaded, v_id, folder, bookName]);

  // Auto-save Layouts (layoutStyle & layoutColors) to MongoDB
  useEffect(() => {
    if (!isDataLoaded || !v_id || !layoutColors) return;

    const timer = setTimeout(() => {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return;
      try {
        const user = JSON.parse(storedUser);
        const userEmail = user?.emailId || user?.email;
        if (!userEmail) return;
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

        axios.post(`${backendUrl}/api/flipbook/update-settings`, {
          emailId: userEmail,
          v_id: v_id,
          folderName: folder || 'Recent Book',
          bookName: bookNameRef.current || bookName,
          Layouts: {
            layoutStyle: layoutSettings,
            layoutColors: layoutColors
          }
        }).catch(err => console.warn("Layouts auto-save warning:", err));
      } catch (e) {
        console.error("User parse error in Layouts auto-save", e);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [layoutSettings, layoutColors, isDataLoaded, v_id, folder, bookName]);

  // Save Bookmarks and Notes Logic
  useEffect(() => {
    if (isDataLoaded) {
      saveToDB(`customized_editor_bookmarks_${v_id || 'default'}`, bookmarks);
      saveToDB(`customized_editor_notes_${v_id || 'default'}`, notes);
    }
  }, [bookmarks, notes, isDataLoaded]);

  // Logic for saving and exporting
  const handleExport = useCallback(() => {
    console.log("Exporting...");
  }, []);

  const lastLoadedBookNameRef = useRef(null);

  const handleSave = useCallback(async () => {
    try {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return;
      const user = JSON.parse(storedUser);
      const userEmail = user?.emailId || user?.email;
      if (!userEmail) return;

      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

      const prevBookName = lastLoadedBookNameRef.current || currentBook?.flipbookName;
      const validBookName = bookName || currentBook?.flipbookName || currentBook?.title || (v_id ? decodeURIComponent(v_id) : 'Untitled Document');
      const newBookName = validBookName;
      const isRenamed = prevBookName && prevBookName !== newBookName && prevBookName !== 'Name of the Book';

      // 1. Save flipbook pages and structure to /api/flipbook/save (same as main editor)
      if (pages && pages.length > 0 && validBookName) {
        const payloadPages = pages.map((p, index) => ({
          pageName: p.name || `Page ${index + 1}`,
          content: p.html || p.content || '',
          v_id: p.v_id || (typeof p.id === 'string' && p.id.length > 5 ? p.id : null)
        }));

        const savePayload = {
          emailId: userEmail,
          v_id: v_id,
          flipbookName: validBookName,
          folderName: folder || 'Recent Book',
          overwrite: true,
          pages: payloadPages
        };

        await axios.post(`${backendUrl}/api/flipbook/save`, savePayload).catch(err => {
          console.warn("Main save endpoint call in CustomizedEditor warning:", err);
        });
      }

      // Ensure all gallery settings, popup customization, and control properties are fully synced in payload
      const rawGalleryImages = (otherSetupSettings?.gallery?.images && otherSetupSettings.gallery.images.length > 0)
        ? otherSetupSettings.gallery.images
        : (menuBarSettings?.interaction?.gallerySettings?.images || []);

      const effectiveGalleryImages = rawGalleryImages.filter(img => img && img.url && !img.url.startsWith('blob:'));

      const mergedGallerySettings = {
        ...(menuBarSettings?.interaction?.gallerySettings || {}),
        ...(otherSetupSettings?.gallery || {}),
        images: effectiveGalleryImages
      };

      const syncedMenuBarSettings = {
        ...menuBarSettings,
        interaction: {
          ...menuBarSettings?.interaction,
          gallerySettings: mergedGallerySettings
        }
      };

      const syncedOtherSetupSettings = {
        ...otherSetupSettings,
        gallery: mergedGallerySettings
      };

      // 2. Save customization settings
      const payload = {
        emailId: userEmail,
        folderName: folder || 'Recent Book',
        v_id: v_id,
        bookName: v_id,
        oldName: prevBookName,
        newName: validBookName,
        share: {
          ...(shareSettings || {}),
          access: visibilitySettings?.type || 'Public',
          password: visibilitySettings?.password || '',
          accessKey: visibilitySettings?.accessKey || '',
          isPasswordSaved: Boolean(visibilitySettings?.isPasswordSaved),
          inviteOnly: visibilitySettings?.inviteOnly || {}
        },
        Customized_Settings: {
          FlipbookInfo: {
            category: currentBook?.category || 'Product Based',
            language: currentBook?.language || 'English',
            tags: currentBook?.tags || [],
            quotes: currentBook?.quotes || '',
            about: currentBook?.about || ''
          },
          Branding: {
            logoSettings,
            watermarkSettings,
            preloaderSettings,
            profileSettings
          },
          Background: backgroundSettings,
          MenuBar: syncedMenuBarSettings,
          Layouts: {
            layoutStyle: layoutSettings,
            layoutColors: layoutColors
          },
          BookAppearance: bookAppearanceSettings,
          otherSetup: syncedOtherSetupSettings,
          leadForm: leadFormSettings,
          Visibility: visibilitySettings
        }
      };

      await axios.post(`${backendUrl}/api/flipbook/update-settings`, payload);
      setShareSettings(payload.share);

      let updatedPagesList = pages;
      if (isRenamed) {
        const sanitizedEmail = user.emailId.replace(/[@.]/g, "_");
        const realFolder = (currentBook?.folderName && Array.isArray(currentBook.folderName))
          ? (currentBook.folderName.find(f => f !== 'Recent Book' && f !== 'Recent book') || 'My_Flipbooks')
          : (folder && folder !== 'Recent Book' ? folder : 'My_Flipbooks');

        const newPBaseUrl = getSupabaseBaseUrl(sanitizedEmail, realFolder, newBookName);
        setProjectBaseUrl(newPBaseUrl);

        const escapedOld = prevBookName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ /g, "(?: |%20)");
        const oldPathRegex = new RegExp(`/${escapedOld}/`, 'g');
        const newPathSegment = `/${newBookName}/`;

        setPages(prevPages => {
          if (!prevPages) return [];
          updatedPagesList = prevPages.map(p => {
            const h = p.html || p.content || '';
            const newH = h.replace(oldPathRegex, newPathSegment);
            return {
              ...p,
              html: newH,
              content: newH
            };
          });
          return updatedPagesList;
        });

        lastLoadedBookNameRef.current = newBookName;
      }

      saveToDB('editor_autosave', {
        v_id: v_id,
        pages: updatedPagesList,
        activePageIndex: targetPage || 0,
        pageName: newBookName,
        timestamp: Date.now(),
        isDoublePage: false,
        settings: payload.settings
      });

      if (setCurrentBook) {
        setCurrentBook(prev => ({
          ...(prev || {}),
          flipbookName: newBookName,
          realName: newBookName,
          title: newBookName,
          meta: {
            ...(prev?.meta || {}),
            flipbookName: newBookName
          }
        }));
      }

      if (setHasUnsavedChanges) {
        setHasUnsavedChanges(false);
        notifiedUnsavedRef.current = false; // Reset the notification flag after save
      }
      if (triggerSaveSuccess) triggerSaveSuccess({ name: newBookName, folder: 'Customized' });
      setSaveSuccessInfo({ name: newBookName, folder: 'Customized' });
      setTimeout(() => setSaveSuccessInfo(null), 3000);
    } catch (error) {
      console.error("Save failed", error);
    }
  }, [folder, v_id, bookName, pages, logoSettings, watermarkSettings, preloaderSettings, profileSettings, backgroundSettings, bookAppearanceSettings, layoutSettings, menuBarSettings, otherSetupSettings, leadFormSettings, visibilitySettings, setHasUnsavedChanges, triggerSaveSuccess, currentBook, targetPage, setCurrentBook]);

  // Use refs to keep context handlers up-to-date without triggering useEffect re-registrations
  const handleSaveRef = useRef(handleSave);
  handleSaveRef.current = handleSave;
  const handleExportRef = useRef(handleExport);
  handleExportRef.current = handleExport;

  // Stable wrappers that call the latest version of the handlers
  const stableSaveHandler = useCallback((...args) => handleSaveRef.current?.(...args), []);
  const stableExportHandler = useCallback((...args) => handleExportRef.current?.(...args), []);

  const handlePreview = useCallback(() => {
    // Close profile popup if it's open
    window.dispatchEvent(new Event('close-profile-preview'));

    const shareId = shareSettings?.shareId || currentBook?.shareId || v_id;
    const previewUrl = shareId ? `/preview?shareId=${shareId}` : (v_id ? `/preview?v_id=${v_id}` : '/preview');
    
    // 1. Open preview immediately in new tab for instant response
    window.open(previewUrl, '_blank');

    // 2. Cache editor state to IndexedDB
    try {
      saveToDB('editor_autosave', {
        v_id: v_id,
        pages: pages,
        activePageIndex: targetPage || 0,
        pageName: bookName,
        timestamp: Date.now(),
        isDoublePage: false,
        projectBaseUrl: projectBaseUrl,
        settings: {
          logo: logoSettings,
          watermark: watermarkSettings,
          preloader: preloaderSettings,
          profile: profileSettings,
          background: backgroundSettings,
          appearance: bookAppearanceSettings,
          layout: layoutSettings,
          layoutColors: layoutColors,
          menubar: menuBarSettings,
          othersetup: otherSetupSettings,
          leadform: leadFormSettings,
          visibility: visibilitySettings
        }
      });
    } catch (e) {
      console.warn("Failed to autosave preview to IndexedDB:", e);
    }

    // 3. Trigger backend save asynchronously in the background without blocking the UI
    if (handleSaveRef.current) {
      handleSaveRef.current().catch(err => {
        console.error("Background save on preview failed:", err);
      });
    }
  }, [shareSettings, currentBook, v_id, pages, targetPage, bookName, projectBaseUrl, logoSettings, watermarkSettings, preloaderSettings, profileSettings, backgroundSettings, bookAppearanceSettings, layoutSettings, layoutColors, menuBarSettings, otherSetupSettings, leadFormSettings, visibilitySettings]);

  const handlePreviewRef = useRef(handlePreview);
  handlePreviewRef.current = handlePreview;
  const stablePreviewHandler = useCallback(() => handlePreviewRef.current?.(), []);
  const handleClearAllPages = useCallback(() => {
    const defaultW = currentBook?.width || 210;
    const defaultH = currentBook?.height || 297;
    setPages(prevPages => 
      prevPages.map((p, i) => {
        const blankSvg = createDefaultPageData(p.name || `Page ${i + 1}`, defaultW, defaultH);
        return {
          ...p,
          content: blankSvg,
          html: blankSvg
        };
      })
    );
    if (setHasUnsavedChanges) setHasUnsavedChanges(true);
  }, [currentBook, setHasUnsavedChanges]);

  // Export/Save Handlers for Context (Registration)
  useEffect(() => {
    if (setExportHandler) setExportHandler(() => stableExportHandler);
    if (setSaveHandler) setSaveHandler(() => stableSaveHandler);
    if (setPreviewHandler) setPreviewHandler(() => stablePreviewHandler);
    if (setClearHandler) setClearHandler(() => handleClearAllPages);

    window.addEventListener('trigger-clear-flipbook', handleClearAllPages);

    return () => {
      if (setExportHandler) setExportHandler(null);
      if (setSaveHandler) setSaveHandler(null);
      if (setPreviewHandler) setPreviewHandler(null);
      if (setClearHandler) setClearHandler(null);
      window.removeEventListener('trigger-clear-flipbook', handleClearAllPages);
    };
  }, [setExportHandler, setSaveHandler, setPreviewHandler, setClearHandler, stableSaveHandler, stableExportHandler, stablePreviewHandler, handleClearAllPages]);

  // Sync Current Book to Navbar and ShareModal in real-time
  useEffect(() => {
    if (setCurrentBook) {
      const currentAccess = visibilitySettings?.type || visibilitySettings?.access || 'Public';
      const effectiveShareId = 
        shareSettings?.shareId || 
        visibilitySettings?.shareId || 
        visibilitySettings?.Visibility?.shareId || 
        '';

      setCurrentBook(prev => {
        const sId = effectiveShareId || prev?.shareId || prev?.share?.shareId || prev?.Customized_Settings?.Visibility?.shareId || v_id;
        return {
          ...(prev || {}),
          folder: folder,
          flipbookName: bookName,
          v_id: v_id,
          shareId: sId,
          type: currentAccess,
          access: currentAccess,
          shareAccess: currentAccess,
          share: {
            ...(prev?.share || {}),
            ...shareSettings,
            ...visibilitySettings,
            shareId: sId,
            access: currentAccess
          },
          Visibility: {
            ...(prev?.Visibility || {}),
            ...visibilitySettings,
            shareId: sId,
            access: currentAccess
          },
          Customized_Settings: {
            ...(prev?.Customized_Settings || {}),
            Visibility: {
              ...(prev?.Customized_Settings?.Visibility || {}),
              ...visibilitySettings,
              shareId: sId,
              access: currentAccess
            }
          },
          pages: pages,
          settings: {
            ...(prev?.settings || {}),
            visibility: visibilitySettings
          }
        };
      });
    }
  }, [setCurrentBook, folder, v_id, bookName, shareSettings, pages, visibilitySettings]);

  const [isLoading, setIsLoading] = useState(true);
  const [isDataLoadingComplete, setIsDataLoadingComplete] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    let interval;
    if (isLoading) {
      setLoadingProgress(0);
      interval = setInterval(() => {
        setLoadingProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          // Smooth progressive animation increment
          const increment = prev < 40 ? 5 : prev < 75 ? 3 : 1;
          return Math.min(prev + increment, 100);
        });
      }, 40);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  useEffect(() => {
    if (isDataLoadingComplete && loadingProgress === 100 && isLoading) {
      const timeout = setTimeout(() => {
        setIsLoading(false);
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [isDataLoadingComplete, loadingProgress, isLoading]);

  const initialLoadRef = useRef(true);
  const notifiedUnsavedRef = useRef(false);

  // Track changes for unsaved status
  useEffect(() => {
    if (initialLoadRef.current) return;

    if (setHasUnsavedChanges && !notifiedUnsavedRef.current) {
      setHasUnsavedChanges(true);
      notifiedUnsavedRef.current = true;
    }
  }, [
    bookName, logoSettings, profileSettings, backgroundSettings,
    bookAppearanceSettings, layoutSettings, menuBarSettings,
    otherSetupSettings, leadFormSettings, visibilitySettings,
    setHasUnsavedChanges
  ]);

  const autoSaveTimerRef = useRef(null);

  // Auto-Save Mechanism for Customized Editor (Only runs when user makes changes)
  useEffect(() => {
    if (isAutoSaveEnabled && hasUnsavedChanges && !initialLoadRef.current && !isLoading) {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(() => {
        if (handleSaveRef.current) {
          handleSaveRef.current();
        }
      }, 2500);
    }
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [
    isAutoSaveEnabled, hasUnsavedChanges, isLoading,
    bookName, logoSettings, profileSettings, backgroundSettings,
    bookAppearanceSettings, layoutSettings, menuBarSettings,
    otherSetupSettings, leadFormSettings, visibilitySettings
  ]);

  // Initial load management
  useEffect(() => {
    // Only release the initial load lock AFTER loading has fully completed
    if (!isLoading && initialLoadRef.current) {
      // Small timeout to allow React to batch and apply all the fetched state updates
      const timer = setTimeout(() => {
        initialLoadRef.current = false;
        if (setHasUnsavedChanges) setHasUnsavedChanges(false);
        notifiedUnsavedRef.current = false;
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isLoading, setHasUnsavedChanges]);

  // Load Flipbook Data
  useEffect(() => {
    const fetchBook = async () => {
      let isAutosaveLoaded = false;
      // Check for recent autosave first (sync from TemplateEditor)
      const autosave = await getFromDB('editor_autosave');
      if (autosave && autosave.v_id === v_id && autosave.pages && autosave.pages.length > 0) {
        // Check if pages are corrupted from previous bug (e.g., html is an object, undefined, or empty string)
        const isCorrupted = autosave.pages.some(p => 
          typeof p.html === 'object' || 
          typeof p.content === 'object' || 
          !p.html || p.html.trim() === ''
        );

        if (!isCorrupted) {
          console.log('CustomizedEditor: Loading from autosave');
          isAutosaveLoaded = true;
          try {
            const data = autosave;
            setPages(data.pages.map((p, i) => ({
              id: p.id || i,
              name: p.name || `Page ${i + 1}`,
              html: p.html || p.content || '',
              content: p.html || p.content || '',
              isHidden: p.isHidden || p.hide === 1
            })));
            if (data.pageName && (!currentBook?.flipbookName || currentBook?.flipbookName === 'Name of the Book')) {
              setBookName(data.pageName);
            }
            // Start from the first page on initial load if no page specified in URL
            if (!page) setTargetPage(0);
          } catch (e) {
            console.error("CustomizedEditor: Failed to load autosave", e);
            isAutosaveLoaded = false;
          }
        } else {
          console.warn('CustomizedEditor: Autosave is corrupted. Ignoring and clearing it.');
          // We don't await this to avoid blocking the fetch
          saveToDB('editor_autosave', null);
        }
      }

      // Only load from local IndexedDB if there is NO v_id (new unsaved draft)
      if (!v_id) {
        const appearance = await getFromDB(`customized_editor_appearance_default`);
        if (appearance) {
          if (appearance.background) setBackgroundSettings(appearance.background);
          if (appearance.appearance) setBookAppearanceSettings(appearance.appearance);
          if (appearance.layout) setLayoutSettings(appearance.layout);
          if (appearance.layoutColors) setLayoutColors(appearance.layoutColors);
        }

        const branding = await getFromDB(`customized_editor_branding_default`);
        if (branding) {
          if (branding.logo) setLogoSettings(branding.logo);
          if (branding.watermark) setWatermarkSettings(branding.watermark);
          if (branding.profile) setProfileSettings(branding.profile);
        }

        const setup = await getFromDB(`customized_editor_setup_default`);
        if (setup) {
          if (setup.menuBar) setMenuBarSettings(setup.menuBar);
          if (setup.otherSetup) setOtherSetupSettings(setup.otherSetup);
          if (setup.leadForm) setLeadFormSettings(setup.leadForm);
          if (setup.visibility) setVisibilitySettings(setup.visibility);
        }
      }

      if (v_id) {
        console.log('CustomizedEditor: Fetching flipbook with folder:', folder, 'v_id:', v_id);
        try {
          const storedUser = localStorage.getItem('user');
          if (!storedUser) return;
          const user = JSON.parse(storedUser);
          const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

          const res = await axios.get(`${backendUrl}/api/flipbook/get`, {
            params: { emailId: user.emailId, v_id, folderName: folder, bookName: decodeURIComponent(v_id) }
          });

          if (res.data) {
            let pBaseUrl = null;
            if (res.data.meta) {
              const sanitizedEmail = user?.emailId?.replace(/[@.]/g, "_");
              pBaseUrl = getSupabaseBaseUrl(sanitizedEmail, res.data.meta.folderName, res.data.meta.flipbookName);
              setProjectBaseUrl(pBaseUrl);
            }



            // ONLY overwrite pages if we DON'T have an autosave
            const fetchedName = res.data.meta?.flipbookName || res.data.name || location.state?.flipbookName || decodeURIComponent(v_id);
            if (fetchedName && fetchedName !== 'Name of the Book') {
              setBookName(fetchedName);
              lastLoadedBookNameRef.current = fetchedName;
            }
              if (res.data.pages) {
                const mappedPages = await Promise.all(res.data.pages.map(async (p, i) => {
                  let rawHTML = p.html || p.content || '';

                  if (!rawHTML || typeof rawHTML !== 'string' || rawHTML.trim() === '') {
                    const metaW = res.data.meta?.width || res.data.settings?.width || location.state?.width || currentBook?.width || 210;
                    const metaH = res.data.meta?.height || res.data.settings?.height || location.state?.height || currentBook?.height || 297;
                    const defaultData = createDefaultPageData(p.name || `Page ${i + 1}`, metaW, metaH);
                    rawHTML = defaultData;
                  }

                  // Heal broken paths from previous sessions if needed
                  if (rawHTML.includes('nullassets/') && pBaseUrl) {
                    rawHTML = rawHTML.split('nullassets/').join(`${pBaseUrl}assets/`);
                  }

                  // Fix relative image paths generated by PDF uploads
                  if (rawHTML.includes('./assets/') && pBaseUrl) {
                    rawHTML = rawHTML.split('./assets/').join(`${pBaseUrl}assets/`);
                  }

                  return {
                    id: p.id || i,
                    content: rawHTML,
                    name: p.name || `Page ${i + 1}`,
                    html: rawHTML,
                    isHidden: p.hide === 1 || p.isHidden
                  };
                }));
                setPages(mappedPages);
              }

            // ALWAYS load settings directly from backend
            const cs = res.data.Customized_Settings || res.data.settings || {};
            const cb = cs.Branding || cs.branding || res.data.Branding || res.data.branding || {};

            const lVal = cb.logoSettings || cb.logo || cs.logoSettings || cs.logo || res.data.logoSettings || res.data.logo;
            if (lVal && typeof lVal === 'object') setLogoSettings(lVal);

            const wVal = cb.watermarkSettings || cb.watermark || cs.watermarkSettings || cs.watermark || res.data.watermarkSettings || res.data.watermark;
            if (wVal && typeof wVal === 'object') setWatermarkSettings(wVal);

            const pVal = cb.preloaderSettings || cb.preloader || cs.preloaderSettings || cs.preloader || res.data.preloaderSettings || res.data.preloader;
            if (pVal && typeof pVal === 'object') {
              setPreloaderSettings(pVal);
            }

            const prVal = cb.profileSettings || cb.profile || cs.profileSettings || cs.profile || res.data.profileSettings || res.data.profile;
            if (prVal && typeof prVal === 'object') setProfileSettings(prVal);
            const customizedBackground = res.data.Customized_Settings?.Background || res.data.settings?.Background;
            if (customizedBackground) {
              setBackgroundSettings(customizedBackground);
            }
            const loadedLayouts = res.data.Customized_Settings?.Layouts || res.data.settings?.Layouts || res.data.settings?.layouts;
            if (loadedLayouts) {
              const styleVal = loadedLayouts.layoutStyle !== undefined ? loadedLayouts.layoutStyle : loadedLayouts.style;
              if (styleVal !== undefined) setLayoutSettings(styleVal);
              if (loadedLayouts.layoutColors) setLayoutColors(loadedLayouts.layoutColors);
            }
            const customizedAppearance = res.data.Customized_Settings?.BookAppearance || res.data.Customized_Settings?.bookAppearance || res.data.Customized_Settings?.appearance || res.data.settings?.appearance || res.data.settings?.bookAppearanceSettings;
            if (customizedAppearance) {
              let validSpeed = customizedAppearance.flipSpeed;
              if (validSpeed === 'medium') {
                 validSpeed = 'Fast';
              } else if (validSpeed === 'Slow' && !customizedAppearance.speedChanged) {
                 validSpeed = 'Fast'; // force Fast if it's Slow but user hasn't explicitly saved it
              }
              customizedAppearance.flipSpeed = validSpeed;
              setBookAppearanceSettings(customizedAppearance);
            }
            if (res.data.settings) {
              if (res.data.settings.background && !customizedBackground) setBackgroundSettings(res.data.settings.background);
              if (res.data.settings.appearance) {
                  const appSettings = res.data.settings.appearance;
                  let vSpeed = appSettings.flipSpeed;
                  if (vSpeed === 'medium') {
                     vSpeed = 'Fast';
                  } else if (vSpeed === 'Slow' && !appSettings.speedChanged) {
                     vSpeed = 'Fast';
                  }
                  appSettings.flipSpeed = vSpeed;
                  setBookAppearanceSettings(appSettings);
              }
              if (res.data.settings.layout && (!loadedLayouts || (loadedLayouts.layoutStyle === undefined && loadedLayouts.style === undefined))) {
                setLayoutSettings(res.data.settings.layout);
              }
            }
            const loadedMenuBar = res.data.Customized_Settings?.MenuBar || res.data.settings?.MenuBar || res.data.settings?.menubar;
            const loadedOtherSetup = res.data.Customized_Settings?.otherSetup || res.data.settings?.otherSetup || res.data.settings?.othersetup;

            if (loadedMenuBar || loadedOtherSetup) {
                const mediaObj = loadedMenuBar?.media || {};
                const audioVal = mediaObj.audio !== undefined
                  ? Boolean(mediaObj.audio)
                  : (mediaObj.backgroundAudio !== undefined ? Boolean(mediaObj.backgroundAudio) : true);

                const rawCustomBgSounds = (Array.isArray(loadedOtherSetup?.sound?.customBgSounds) && loadedOtherSetup.sound.customBgSounds.length > 0)
                  ? loadedOtherSetup.sound.customBgSounds
                  : (Array.isArray(mediaObj.audioSettings?.customBgSounds) ? mediaObj.audioSettings.customBgSounds : []);

                const audioCustomBgSounds = rawCustomBgSounds.map((item, idx) => ({
                  ...item,
                  label: item.label || item.id || item.name || `BG Sound ${idx + 5}`
                }));

                const audioSet = {
                  ...(mediaObj.audioSettings || {}),
                  ...(loadedOtherSetup?.sound || {}),
                  customBgSounds: audioCustomBgSounds
                };

                const navAddTextToIcons = loadedMenuBar?.navigation?.addTextToIconsSettings || loadedMenuBar?.addTextToIconsSettings || { font: 'Arial' };
                const navToc = loadedMenuBar?.navigation?.tocSettings || loadedMenuBar?.tocSettings || { addSearch: true, addPageNumber: true, addSerialNumberHeading: true, addSerialNumberSubheading: true, content: [] };
                const navBookmark = loadedMenuBar?.navigation?.bookmarkSettings || loadedMenuBar?.bookmarkSettings || { icon: 'default', font: 'Poppins', color: '#C45A5A', shape: 1, style: 1, items: [] };

                const loadedGalleryImgs = (Array.isArray(loadedOtherSetup?.gallery?.images) && loadedOtherSetup.gallery.images.length > 0)
                  ? loadedOtherSetup.gallery.images
                  : (Array.isArray(loadedMenuBar?.interaction?.gallerySettings?.images) ? loadedMenuBar.interaction.gallerySettings.images : []);

                if (loadedMenuBar) {
                  setMenuBarSettings({
                    ...loadedMenuBar,
                    interaction: {
                      ...(loadedMenuBar.interaction || {}),
                      gallerySettings: {
                        imageFitType: 'Fill All',
                        transitionEffect: 'Linear',
                        primaryColor: '#4F46E5',
                        secondaryColor: '#9CA3AF',
                        bgColor: '#FFFFFF',
                        navigationIconType: 'Chevron',
                        autoPlay: true,
                        speed: 2,
                        infiniteLoop: true,
                        showDots: true,
                        ...(loadedMenuBar.interaction?.gallerySettings || {}),
                        images: loadedGalleryImgs
                      }
                    },
                    media: {
                      autoFlip: true,
                      ...(mediaObj || {}),
                      audio: audioVal,
                      backgroundAudio: audioVal,
                      audioSettings: {
                        bgSound: audioSet.bgSound || 'BG Sound 1',
                        bgSoundFile: audioSet.bgSoundFile || '',
                        customBgSounds: audioCustomBgSounds,
                        flipSound: audioSet.flipSound || 'Soft Paper Flip',
                        pageSpecificSound: Boolean(audioSet.pageSpecificSound)
                      }
                    },
                    addTextToIconsSettings: navAddTextToIcons,
                    tocSettings: navToc,
                    navigation: {
                      ...(loadedMenuBar.navigation || {}),
                      addTextToIconsSettings: navAddTextToIcons,
                      tocSettings: navToc,
                      bookmarkSettings: navBookmark
                    }
                  });
                }

                const loadedGallerySettings = {
                  ...(loadedMenuBar?.interaction?.gallerySettings || {}),
                  ...(loadedOtherSetup?.gallery || {})
                };

                setOtherSetupSettings(prev => ({
                  ...(prev || {}),
                  ...(loadedOtherSetup || {}),
                  gallery: {
                    ...(prev?.gallery || {}),
                    ...loadedGallerySettings,
                    transitionEffect: loadedGallerySettings.transitionEffect || prev?.gallery?.transitionEffect || 'Linear',
                    primaryColor: loadedGallerySettings.primaryColor || prev?.gallery?.primaryColor || '#555555',
                    secondaryColor: loadedGallerySettings.secondaryColor || prev?.gallery?.secondaryColor || '#9B9B9B',
                    bgColor: loadedGallerySettings.bgColor || prev?.gallery?.bgColor || '#FFFFFF',
                    navStyle: loadedGallerySettings.navStyle || loadedGallerySettings.navigationIconType || prev?.gallery?.navStyle || 1,
                    autoSlide: loadedGallerySettings.autoSlide ?? loadedGallerySettings.autoPlay ?? prev?.gallery?.autoSlide ?? true,
                    autoPlay: loadedGallerySettings.autoPlay ?? loadedGallerySettings.autoSlide ?? prev?.gallery?.autoPlay ?? true,
                    speed: loadedGallerySettings.speed ?? prev?.gallery?.speed ?? 2,
                    infiniteLoop: loadedGallerySettings.infiniteLoop ?? prev?.gallery?.infiniteLoop ?? true,
                    showDots: loadedGallerySettings.showDots ?? prev?.gallery?.showDots ?? true,
                    images: loadedGalleryImgs
                  },
                  sound: {
                    ...(prev?.sound || {}),
                    ...(loadedOtherSetup?.sound || {}),
                    bgSound: audioSet.bgSound || loadedOtherSetup?.sound?.bgSound || prev?.sound?.bgSound || 'BG Sound 1',
                    bgSoundFile: audioSet.bgSoundFile || loadedOtherSetup?.sound?.bgSoundFile || prev?.sound?.bgSoundFile || '',
                    customBgSounds: audioCustomBgSounds,
                    flipSound: audioSet.flipSound || loadedOtherSetup?.sound?.flipSound || prev?.sound?.flipSound || 'Soft Paper Flip',
                    pageSpecificSound: audioSet.pageSpecificSound !== undefined ? Boolean(audioSet.pageSpecificSound) : Boolean(loadedOtherSetup?.sound?.pageSpecificSound ?? prev?.sound?.pageSpecificSound),
                    bgSoundEnabled: audioVal
                  }
                }));
              }
              const loadedLeadForm = res.data.Customized_Settings?.leadForm || res.data.settings?.leadForm || res.data.settings?.leadform;
              if (loadedLeadForm) {
                let lf = { ...loadedLeadForm };
                if (lf.fields && !Array.isArray(lf.fields)) {
                  const newFields = [];
                  if (lf.fields.name) newFields.push({ id: '1', type: 'name', placeholder: 'Enter your Name' });
                  if (lf.fields.email) newFields.push({ id: '2', type: 'email', placeholder: 'Enter your Gmail' });
                  if (lf.fields.phone) newFields.push({ id: '3', type: 'phone', placeholder: 'Enter your Phone Number' });
                  if (lf.fields.feedback) newFields.push({ id: '4', type: 'feedback', placeholder: 'Enter your Feedback' });
                  lf.fields = newFields;
                }
                setLeadFormSettings(lf);
              }
              const loadedVisibility = res.data.Customized_Settings?.Visibility || res.data.settings?.visibility || res.data.settings?.Visibility;
              if (loadedVisibility) setVisibilitySettings(loadedVisibility);
              if (res.data.settings?.bookmarks) setBookmarks(res.data.settings.bookmarks);
              if (res.data.settings?.notes) setNotes(res.data.settings.notes);
            let shareData = res.data.share;
            if (!shareData || !shareData.shareId) {
              const newShareId = Math.random().toString(36).substring(2, 14);
              shareData = { shareId: newShareId, access: 'public' };
              // Try to save the newly generated shareId to the backend
              axios.post(`${backendUrl}/api/flipbook/update-settings`, {
                emailId: user.emailId,
                v_id: v_id,
                share: shareData
              }).catch(err => console.error('Frontend shareId auto-heal save failed:', err));
            }
            setShareSettings(shareData);

            if (shareData) {
              setVisibilitySettings(prev => ({
                ...prev,
                type: shareData.access || prev.type || 'Public',
                password: shareData.password || prev.password || '',
                accessKey: shareData.accessKey || prev.accessKey || '',
                isPasswordSaved: shareData.isPasswordSaved !== undefined ? shareData.isPasswordSaved : prev.isPasswordSaved,
                inviteOnly: shareData.inviteOnly || prev.inviteOnly || {}
              }));
            }

            if (setCurrentBook) {
              setCurrentBook(prev => ({
                ...(prev || {}),
                isPublished: res.data.isPublished !== undefined ? Boolean(res.data.isPublished) : Boolean(res.data.meta?.isPublished),
                flipbookName: res.data.meta?.flipbookName || res.data.name || prev?.flipbookName,
                quotes: res.data.quotes || res.data.meta?.quotes || prev?.quotes || '',
                about: res.data.about || res.data.meta?.about || prev?.about || '',
                category: res.data.category || res.data.meta?.category || prev?.category || 'Product Based',
                language: res.data.language || res.data.meta?.language || prev?.language || 'English',
                tags: res.data.tags || res.data.meta?.tags || prev?.tags || [],
                meta: {
                  ...(prev?.meta || {}),
                  ...(res.data.meta || {})
                }
              }));
            }
          }
        } catch (err) {
          console.error("CustomizedEditor: Failed to fetch flipbook", err);
          if (!currentBook?.flipbookName || currentBook?.flipbookName === 'Name of the Book') {
            setBookName(location.state?.flipbookName || decodeURIComponent(v_id) || 'Name of the Book');
          }
        } finally {
          setIsDataLoadingComplete(true);
          setIsDataLoaded(true);
          // Fallback: If we still have 0 pages, initialize empty ones to prevent UI from breaking
          setPages(prevPages => {
            if (!prevPages || prevPages.length === 0) {
              const count = location.state?.pageCount || 12;
              const w = location.state?.width || currentBook?.width || 210;
              const h = location.state?.height || currentBook?.height || 297;
              console.log(`CustomizedEditor: No pages loaded. Initializing ${count} default pages (${w}x${h}mm).`);
              return Array.from({ length: count }, (_, i) => {
                const name = `Page ${i + 1}`;
                const defaultData = createDefaultPageData(name, w, h);
                return {
                  id: i + 1,
                  name: name,
                  html: defaultData,
                  content: defaultData
                };
              });
            }
            return prevPages;
          });
        }
      } else {
        setIsDataLoadingComplete(true);
        setIsDataLoaded(true);
      }
    };
    fetchBook();
  }, [v_id, folder]);





  const renderDetailContent = () => {
    const handleBack = () => setIsPanelCollapsed(true);
    switch (activeSubView) {
      case 'logo':
        return (
          <Branding
            type={activeSubView}
            onBack={handleBack}
            logoSettings={logoSettings}
            onUpdateLogo={(newVal) => setLogoSettings(prev => ({ ...(prev || {}), ...(newVal || {}) }))}
            watermarkSettings={watermarkSettings}
            onUpdateWatermark={(newVal) => setWatermarkSettings(prev => ({ ...(prev || {}), ...(newVal || {}) }))}
            preloaderSettings={preloaderSettings}
            onUpdatePreloader={(newVal) => setPreloaderSettings(prev => ({ ...(prev || {}), ...(newVal || {}) }))}
            folder={folder}
            flipbookName={bookName}
            v_id={v_id}
            onPreviewPreloader={() => {
              setIsLoading(true);
              setTimeout(() => {
                setIsLoading(false);
              }, 3000);
            }}
          />
        );
      case 'background':
      case 'layout':
      case 'bookappearance':
        return (
          <Appearance
            activeSub={activeSubView}
            onBack={handleBack}
            backgroundSettings={backgroundSettings}
            onUpdateBackground={setBackgroundSettings}
            bookAppearanceSettings={bookAppearanceSettings}
            onUpdateBookAppearance={setBookAppearanceSettings}
            layoutSettings={layoutSettings}
            onUpdateLayout={setLayoutSettings}
            layoutColors={layoutColors}
            onUpdateLayoutColors={setLayoutColors}
            onTocSettingsClick={() => setTocOpenTrigger(prev => prev + 1)}
            pages={pages}
            folder={folder}
            flipbookName={bookName}
            v_id={v_id}
          />
        );
      case 'menubar':
        return (
          <MenuBar
            onBack={handleBack}
            settings={menuBarSettings}
            onUpdate={setMenuBarSettings}
            otherSettings={otherSetupSettings}
            onUpdateOther={setOtherSetupSettings}
            pages={pages}
            folderName={folder}
            bookName={bookName}
            activeLayout={layoutSettings}
            onNavigateToOtherSetup={(target) => {
              setActiveSubView('othersetup');
              setOtherSetupTarget(target);
            }}
            onTocSettingsClick={() => setTocOpenTrigger(prev => prev + 1)}
          />
        );
      case 'othersetup':
        return (
          <OtherSetup
            onBack={handleBack}
            settings={otherSetupSettings}
            onUpdate={setOtherSetupSettings}
            folderName={folder}
            bookName={v_id || bookName}
            pages={pages}
            targetAccordion={otherSetupTarget}
          />
        );
      case 'leadform':
        return (
          <LeadForm
            onBack={handleBack}
            settings={leadFormSettings}
            onUpdate={setLeadFormSettings}
            pages={pages}
          />
        );
      case 'visibility':
        return (
          <Visibility
            onBack={handleBack}
            settings={visibilitySettings}
            onUpdate={setVisibilitySettings}
            bookName={bookName}
            v_id={v_id}
            folder={folder}
          />
        );
      case 'statistic':
        return <Statistic onBack={handleBack} />;
      default:
        return null;
    }
  };

  // Build CSS variables for active layout colors
  const layoutColorVars = useMemo(() => {
    const activeIdx = layoutSettings || 1;
    const defaults = LAYOUT_DEFAULT_COLORS[activeIdx] || [];
    const saved = layoutColors[activeIdx] || [];

    const mergedColors = defaults.map((c) => {
      const savedItem = saved.find(s => s && s.id === c.id);
      return {
        ...c,
        ...(savedItem ? savedItem : {})
      };
    });

    const vars = mergedColors.map((c, i) => {
      const hex = c.hex || '#ffffff';
      const op = 0.4 + (Math.max(0, Math.min(1, (c.opacity ?? 100) / 100)) * 0.6);
      const r = parseInt(hex.slice(1, 3), 16) || 0;
      const g = parseInt(hex.slice(3, 5), 16) || 0;
      const b = parseInt(hex.slice(5, 7), 16) || 0;

      const varName = c.id || `layout-color-${i}`;
      return `--${varName}: ${hex}; --${varName}-opacity: ${op}; --${varName}-rgb: ${r},${g},${b};`;
    }).join(' ');

    // Derive --dropdown-icon from --dropdown-text at 70% opacity IF not already present
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
  }, [layoutSettings, layoutColors]);

  const visiblePages = useMemo(() => pages.filter(p => !p.isHidden), [pages]);

  return (
    <div
      className="flex flex-col h-full w-full bg-[#D9D9D9] overflow-hidden font-sans select-none relative"
      style={layoutColorVars ? Object.fromEntries(layoutColorVars.split(';').filter(v => v.trim()).map(v => {
        const i = v.indexOf(':');
        return [v.slice(0, i).trim(), v.slice(i + 1).trim()];
      })) : {}}
    >
      <style>{`:root { ${layoutColorVars} }`}</style>
      {/* Navbar handled by parent layout */}


      <div className="flex flex-1 overflow-hidden">
        {/* Main Sidebar - Always Visible */}
        <div className="w-[16.25vw] h-full flex-shrink-0 bg-white shadow-xl z-20 relative border-r border-gray-100 overflow-visible">
          <Sidebar
            bookName={bookName}
            setBookName={setBookName}
            activeSubView={activeSubView}
            setActiveSubView={setActiveSubView}
            isPanelCollapsed={isPanelCollapsed}
            setIsPanelCollapsed={setIsPanelCollapsed}
            pageCount={pages.filter(p => !p.isHidden).length}
            visibilitySettings={visibilitySettings}
            onUpdateVisibility={setVisibilitySettings}
            onPreview={stablePreviewHandler}
            onSave={stableSaveHandler}
            currentBook={currentBook}
            setCurrentBook={setCurrentBook}
            isLoading={isLoading}
          />
        </div>

        {/* Sub-side Panel (Detail View) - Opens next to Main Sidebar */}
        <div
          className={`h-full bg-white shadow-lg z-10 border-r border-gray-100 transition-all duration-300 ease-in-out flex-shrink-0 ${activeSubView && !isPanelCollapsed
            ? 'w-[21.25vw] opacity-100 translate-x-0 overflow-visible'
            : 'w-0 opacity-0 -translate-x-full pointer-events-none overflow-hidden'
            }`}
        >
          <div className="w-[21vw] h-full flex flex-col overflow-visible">
            {isLoading ? (
              <div className="p-[1.2vw] flex flex-col gap-[1vw] animate-pulse">
                <div className="flex items-center gap-[0.8vw]">
                  <div className="w-[1.5vw] h-[1.5vw] bg-gray-200/80 rounded-[0.4vw]"></div>
                  <div className="h-[1vw] bg-gray-200/80 rounded-[0.3vw] w-1/2"></div>
                </div>
                <div className="h-[1px] bg-gray-100 my-[0.4vw]"></div>
                <div className="flex flex-col gap-[0.8vw]">
                  <div className="h-[2vw] bg-gray-100/80 rounded-[0.5vw] w-full"></div>
                  <div className="h-[2vw] bg-gray-100/80 rounded-[0.5vw] w-full"></div>
                  <div className="h-[4vw] bg-gray-100/80 rounded-[0.5vw] w-full"></div>
                </div>
              </div>
            ) : (
              activeSubView && renderDetailContent()
            )}
          </div>
        </div>

        {/* Main Preview Area */}
        <div className="flex-1 min-w-0 flex flex-col relative z-0 overflow-hidden">
          {/* Loading Overlay Covers the Preview Area Fully */}
          {isLoading && (
            <div 
              className="absolute inset-0 z-50 flex flex-col items-center justify-center transition-all duration-300"
              style={{
                backgroundColor: preloaderSettings?.bgColor || '#2D2F33',
                color: preloaderSettings?.textColor || '#ffffff'
              }}
            >
              <div className="flex flex-col items-center gap-4">
                {preloaderSettings?.layout !== 'spinner' && preloaderSettings?.logo && (
                  <img src={preloaderSettings.logo} alt="Preloader Logo" className="h-[60px] object-contain" />
                )}
                {preloaderSettings?.layout === 'bar' ? (
                  <div className="flex flex-col items-center gap-2 w-[15vw]">
                    <div className="w-full bg-gray-200/20 h-[0.5vw] rounded-full overflow-hidden">
                      <div 
                        className="h-full animate-pulse rounded-full" 
                        style={{ 
                          width: `${loadingProgress}%`, 
                          backgroundColor: preloaderSettings?.spinnerColor || '#3B3C8A' 
                        }}
                      ></div>
                    </div>
                    {preloaderSettings?.showPercentage && (
                      <span className="text-[0.85vw] font-semibold">{loadingProgress}%</span>
                    )}
                  </div>
                ) : preloaderSettings?.layout === 'dots' ? (
                  <div className="flex flex-col items-center gap-[0.4vw] py-[0.5vw]">
                    <div className="flex items-center gap-1.5">
                      <div className="w-[0.6vw] h-[0.6vw] rounded-full animate-bounce [animation-delay:-0.3s]" style={{ backgroundColor: preloaderSettings?.spinnerColor || '#3B3C8A' }}></div>
                      <div className="w-[0.6vw] h-[0.6vw] rounded-full animate-bounce [animation-delay:-0.15s]" style={{ backgroundColor: preloaderSettings?.spinnerColor || '#3B3C8A' }}></div>
                      <div className="w-[0.6vw] h-[0.6vw] rounded-full animate-bounce" style={{ backgroundColor: preloaderSettings?.spinnerColor || '#3B3C8A' }}></div>
                    </div>
                    {preloaderSettings?.showPercentage && (
                      <span className="text-[0.85vw] font-semibold">{loadingProgress}%</span>
                    )}
                  </div>
                ) : (
                  // circular spinner
                  <div className="relative flex flex-col items-center justify-center">
                    <div className="relative flex items-center justify-center">
                      <div 
                        className={`${preloaderSettings?.logo ? 'w-[80px] h-[80px]' : 'w-[3vw] h-[3vw]'} border-[3px] border-t-transparent rounded-full animate-spin`}
                        style={{ 
                          borderColor: `${preloaderSettings?.spinnerColor || '#3B3C8A'} ${preloaderSettings?.spinnerColor || '#3B3C8A'} ${preloaderSettings?.spinnerColor || '#3B3C8A'} transparent` 
                        }}
                      ></div>
                      {preloaderSettings?.logo && (
                        <img src={preloaderSettings.logo} alt="Preloader Logo" className="absolute h-[45px] max-w-[60px] object-contain" />
                      )}
                      {preloaderSettings?.showPercentage && !preloaderSettings?.logo && (
                        <span className="absolute text-[0.75vw] font-bold">{loadingProgress}%</span>
                      )}
                    </div>
                    {preloaderSettings?.showPercentage && preloaderSettings?.logo && (
                      <span className="text-[0.75vw] font-bold mt-2">{loadingProgress}%</span>
                    )}
                  </div>
                )}
                <p 
                  className="font-semibold text-[0.9vw]"
                  style={{ fontFamily: preloaderSettings?.font || 'Poppins' }}
                >
                  {preloaderSettings?.text || 'Loading Modal Please Wait....'}
                </p>
              </div>
            </div>
          )}
          <PreviewArea
            bookName={bookName}
            pages={visiblePages}
            targetPage={targetPage}
            logoSettings={logoSettings}
            watermarkSettings={watermarkSettings}
            backgroundSettings={backgroundSettings}
            bookAppearanceSettings={bookAppearanceSettings}
            menuBarSettings={menuBarSettings}
            leadFormSettings={leadFormSettings}
            profileSettings={profileSettings}
            otherSetupSettings={otherSetupSettings}
            onUpdateOtherSetup={setOtherSetupSettings}
            activeLayout={layoutSettings}
            layoutColors={layoutColors}
            isSidebarOpen={activeSubView && !isPanelCollapsed}
            activeDevice={activeDevice || 'Desktop'}
            activeSubView={activeSubView}
            bookmarks={bookmarks}
            notes={notes}
            setBookmarks={setBookmarks}
            setNotes={setNotes}
            onFlip={setTargetPage}
            isEditor={true}
            useNativeFullscreen={true}
            baseUrl={projectBaseUrl}
            isLoading={isLoading}
            externalShowTOC={tocOpenTrigger}
            currentBook={currentBook}
          />
        </div>
      </div>

    </div>
  );
};

export default CustomizedEditor;
