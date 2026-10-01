import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@iconify/react';
import { Trash2, Plus, ChevronDown, RefreshCw, Upload, Image as ImageIcon, ChevronRight, ArrowLeftRight, Link } from 'lucide-react';
import axios from 'axios';
import PremiumDropdown from './PremiumDropdown';
import AlertModal from '../AlertModal';
import { AdjustmentSlider, SectionLabel, ImageCropOverlay, CustomColorPicker } from './AppearanceShared';
import ReplaceMediaModal from '../TemplateEditor/ReplaceMediaModal';
import MediaGalleryPopup from '../TemplateEditor/MediaGalleryPopup';

const fontFamilies = [
  'Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana',
  'Helvetica', 'Poppins', 'Roboto', 'Open Sans', 'Lato', 'Montserrat',
  'Inter', 'Playfair Display', 'Oswald', 'Merriweather'
];

const Branding = ({
  type = 'logo',
  logoSettings,
  onUpdateLogo,
  watermarkSettings,
  onUpdateWatermark,
  preloaderSettings,
  onUpdatePreloader,
  onBack,
  onPreviewPreloader,
  folder,
  flipbookName,
  v_id
}) => {
  const fileInputRef = useRef(null);
  const watermarkFileInputRef = useRef(null);
  const [pickerPos, setPickerPos] = useState({ x: 0, y: 0 });
  const [showPreloaderBgColorPicker, setShowPreloaderBgColorPicker] = useState(false);
  const [showPreloaderTextColorPicker, setShowPreloaderTextColorPicker] = useState(false);
  const [showPreloaderSpinnerColorPicker, setShowPreloaderSpinnerColorPicker] = useState(false);
  const galleryInputRef = useRef(null);
  const [showAdjustments, setShowAdjustments] = useState(false);
  const [galleryTarget, setGalleryTarget] = useState(null); // 'logo', 'watermark', or null
  const [showLogoUrlInput, setShowLogoUrlInput] = useState(false);
  const [showWatermarkUrlInput, setShowWatermarkUrlInput] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [showCropOverlay, setShowCropOverlay] = useState(false);
  const [showWatermarkCropOverlay, setShowWatermarkCropOverlay] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [replaceTarget, setReplaceTarget] = useState(null); // 'logo' | 'watermark' | null
  const [showLogoAdjustments, setShowLogoAdjustments] = useState(false);
  const [showWatermarkAdjustments, setShowWatermarkAdjustments] = useState(false);
  const [showPreloaderModal, setShowPreloaderModal] = useState(false);
  const [tempPreloaderSettings, setTempPreloaderSettings] = useState({});
  const [showStyleDropdown, setShowStyleDropdown] = useState(false);

  const handleOpenPreloaderModal = () => {
    setTempPreloaderSettings(preloaderSettings || {});
    setShowPreloaderModal(true);
  };
  const moveTimerRef = useRef(null);
  const moveTimeoutRef = useRef(null);
  const latestWatermarkRef = useRef(watermarkSettings);

  useEffect(() => {
    latestWatermarkRef.current = watermarkSettings;
  }, [watermarkSettings]);

  const startMove = (deltaX, deltaY) => {
    const moveStep = () => {
        if (!latestWatermarkRef.current) return;
        onUpdateWatermark({ 
            ...latestWatermarkRef.current, 
            positionX: (latestWatermarkRef.current.positionX || 0) + deltaX,
            positionY: (latestWatermarkRef.current.positionY || 0) + deltaY 
        });
    };
    moveStep();
    moveTimeoutRef.current = setTimeout(() => {
        moveTimerRef.current = setInterval(moveStep, 50);
    }, 300);
  };

  const stopMove = () => {
    if (moveTimeoutRef.current) clearTimeout(moveTimeoutRef.current);
    if (moveTimerRef.current) clearInterval(moveTimerRef.current);
    moveTimeoutRef.current = null;
    moveTimerRef.current = null;
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
        console.warn("localStorage quota exceeded for branding gallery images", e);
      }
    }
  }, [uploadedImages]);

  const [localGallerySelected, setLocalGallerySelected] = useState(null);

  const [logoResolution, setLogoResolution] = useState('');
  const [logoFileSize, setLogoFileSize] = useState('');
  const [watermarkResolution, setWatermarkResolution] = useState('');
  const [watermarkFileSize, setWatermarkFileSize] = useState('');

  const formatBytes = (bytes, decimals = 1) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  useEffect(() => {
    if (!logoSettings?.src) {
      setLogoResolution('');
      setLogoFileSize('');
      return;
    }
    const img = new Image();
    img.src = logoSettings.src;
    img.onload = () => {
      setLogoResolution(`${img.naturalWidth} x ${img.naturalHeight}`);
    };

    if (logoSettings.src.startsWith('data:')) {
      const base64str = logoSettings.src.split(',')[1];
      if (base64str) {
        const bytes = Math.round(base64str.length * (3 / 4));
        setLogoFileSize(formatBytes(bytes, 1));
      }
    } else if (logoSettings.src.startsWith('blob:')) {
      fetch(logoSettings.src)
        .then(res => res.blob())
        .then(blob => setLogoFileSize(formatBytes(blob.size, 1)))
        .catch(() => setLogoFileSize('Unknown Size'));
    } else {
      fetch(logoSettings.src, { method: 'HEAD' })
        .then(res => {
          if (res.ok) {
            const contentLength = res.headers.get('content-length');
            if (contentLength) {
              setLogoFileSize(formatBytes(parseInt(contentLength, 10), 1));
            } else {
              setLogoFileSize('Unknown Size');
            }
          } else {
            setLogoFileSize('Unknown Size');
          }
        })
        .catch(() => {
          setLogoFileSize('Unknown Size');
        });
    }
  }, [logoSettings?.src]);

  useEffect(() => {
    if (!watermarkSettings?.src) {
      setWatermarkResolution('');
      setWatermarkFileSize('');
      return;
    }
    const img = new Image();
    img.src = watermarkSettings.src;
    img.onload = () => {
      setWatermarkResolution(`${img.naturalWidth} x ${img.naturalHeight}`);
    };

    if (watermarkSettings.src.startsWith('data:')) {
      const base64str = watermarkSettings.src.split(',')[1];
      if (base64str) {
        const bytes = Math.round(base64str.length * (3 / 4));
        setWatermarkFileSize(formatBytes(bytes, 1));
      }
    } else if (watermarkSettings.src.startsWith('blob:')) {
      fetch(watermarkSettings.src)
        .then(res => res.blob())
        .then(blob => setWatermarkFileSize(formatBytes(blob.size, 1)))
        .catch(() => setWatermarkFileSize('Unknown Size'));
    } else {
      fetch(watermarkSettings.src, { method: 'HEAD' })
        .then(res => {
          if (res.ok) {
            const contentLength = res.headers.get('content-length');
            if (contentLength) {
              setWatermarkFileSize(formatBytes(parseInt(contentLength, 10), 1));
            } else {
              setWatermarkFileSize('Unknown Size');
            }
          } else {
            setWatermarkFileSize('Unknown Size');
          }
        })
        .catch(() => {
          setWatermarkFileSize('Unknown Size');
        });
    }
  }, [watermarkSettings?.src]);

  const uploadCustomizedAsset = async (file, assetType) => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser && file) {
        const user = JSON.parse(storedUser);
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
        const formData = new FormData();
        formData.append('action', 'upload');
        formData.append('file', file);
        formData.append('emailId', user.emailId);
        formData.append('assetType', assetType);
        formData.append('folderName', folder || 'My_Flipbooks');
        formData.append('flipbookName', flipbookName || v_id || 'Untitled Document');
        if (v_id) formData.append('v_id', v_id);
        if (assetType === 'logo' && logoSettings?.src) {
          formData.append('oldSrc', logoSettings.src);
        } else if (assetType === 'watermark' && watermarkSettings?.src) {
          formData.append('oldSrc', watermarkSettings.src);
        }

        const res = await axios.post(`${backendUrl}/api/flipbook/branding`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (res.data?.url) {
          return res.data.url;
        }
      }
    } catch (err) {
      console.warn(`[Branding] ${assetType} upload warning:`, err);
    }
    return null;
  };

  const handleLogoReplace = async (file) => {
    if (!file) return;
    const uploadedUrl = await uploadCustomizedAsset(file, 'logo');
    if (uploadedUrl) {
      onUpdateLogo({
        ...logoSettings,
        src: uploadedUrl,
        opacity: logoSettings?.opacity ?? 100,
        adjustments: logoSettings?.adjustments ?? {
          exposure: 0, contrast: 0, saturation: 0, temperature: 0, tint: 0, highlights: 0, shadows: 0
        }
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      onUpdateLogo({
        ...logoSettings,
        src: event.target.result,
        opacity: logoSettings?.opacity ?? 100,
        adjustments: logoSettings?.adjustments ?? {
          exposure: 0, contrast: 0, saturation: 0, temperature: 0, tint: 0, highlights: 0, shadows: 0
        }
      });
    };
    reader.readAsDataURL(file);
  };

  const handlePreloaderLogoReplace = async (file) => {
    if (!file) return;
    const uploadedUrl = await uploadCustomizedAsset(file, 'preloaderLogo');
    if (uploadedUrl) {
      const newSettings = { ...tempPreloaderSettings, logo: uploadedUrl };
      setTempPreloaderSettings(newSettings);
      onUpdatePreloader(newSettings);
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const newSettings = { ...tempPreloaderSettings, logo: event.target.result };
      setTempPreloaderSettings(newSettings);
      onUpdatePreloader(newSettings);
    };
    reader.readAsDataURL(file);
  };

  const handleWatermarkReplace = async (file) => {
    if (!file) return;
    const uploadedUrl = await uploadCustomizedAsset(file, 'watermark');
    if (uploadedUrl) {
      onUpdateWatermark({
        ...watermarkSettings,
        src: uploadedUrl,
        opacity: watermarkSettings?.opacity ?? 64,
        position: watermarkSettings?.position || 'Bottom Right',
        adjustments: watermarkSettings?.adjustments ?? {
          exposure: 0, contrast: 0, saturation: 0, temperature: 0, tint: 0, highlights: 0, shadows: 0
        }
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      onUpdateWatermark({
        ...watermarkSettings,
        src: event.target.result,
        opacity: watermarkSettings?.opacity ?? 64,
        position: watermarkSettings?.position || 'Bottom Right',
        adjustments: watermarkSettings?.adjustments ?? {
          exposure: 0, contrast: 0, saturation: 0, temperature: 0, tint: 0, highlights: 0, shadows: 0
        }
      });
    };
    reader.readAsDataURL(file);
  };

  const handleWatermarkAdjustmentChange = (key, value) => {
    onUpdateWatermark({
      ...watermarkSettings,
      adjustments: {
        ...(watermarkSettings?.adjustments || {}),
        [key]: value
      }
    });
  };

  // Logo Handlers
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const uploadedUrl = await uploadCustomizedAsset(file, 'logo');
      if (uploadedUrl) {
        onUpdateLogo({
          ...logoSettings,
          src: uploadedUrl,
          opacity: logoSettings?.opacity ?? 100,
          adjustments: logoSettings?.adjustments ?? {
            exposure: 0,
            contrast: 0,
            saturation: 0,
            temperature: 0,
            tint: 0,
            highlights: 0,
            shadows: 0
          }
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateLogo({
          ...logoSettings,
          src: reader.result,
          opacity: logoSettings?.opacity ?? 100,
          adjustments: logoSettings?.adjustments ?? {
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
      reader.readAsDataURL(file);
    }
  };

  const handleUrlChange = (e) => {
    onUpdateLogo({ ...logoSettings, src: e.target.value, url: e.target.value });
  };

  const handleLogoTypeChange = (e) => {
    onUpdateLogo({ ...logoSettings, type: e.target.value });
  };

  const confirmRemoveLogo = () => {
    setDeleteTarget('logo');
  };

  const deleteBrandingAsset = async (assetType) => {
    const isLogo = assetType === 'logo';
    const targetSettings = isLogo ? logoSettings : watermarkSettings;
    const targetSrc = targetSettings?.src;

    if (targetSrc) {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
          await axios.post(`${backendUrl}/api/flipbook/branding`, {
            action: 'delete',
            emailId: user.emailId,
            v_id: v_id,
            assetType: assetType,
            src: targetSrc,
            folderName: folder || 'My_Flipbooks',
            flipbookName: flipbookName || v_id || 'Untitled Document'
          });
        }
      } catch (err) {
        console.warn(`[Branding] ${assetType} delete asset warning:`, err);
      }
    }

    if (isLogo) {
      onUpdateLogo({
        src: '',
        url: '',
        type: 'Fit',
        opacity: 100,
        cropData: null,
        adjustments: {
          exposure: 0, contrast: 0, saturation: 0, temperature: 0, tint: 0, highlights: 0, shadows: 0
        }
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      setDeleteTarget(null);
    } else {
      onUpdateWatermark({
        src: '',
        type: 'Fit',
        opacity: 64,
        position: 'Bottom Right',
        cropData: null,
        adjustments: {
          exposure: 0, contrast: 0, saturation: 0, temperature: 0, tint: 0, highlights: 0, shadows: 0
        }
      });
      if (watermarkFileInputRef.current) watermarkFileInputRef.current.value = '';
      setDeleteTarget(null);
    }
  };

  const removeLogo = () => {
    deleteBrandingAsset('logo');
  };

  const removeWatermark = () => {
    deleteBrandingAsset('watermark');
  };

  const handleAdjustmentChange = (key, value) => {
    onUpdateLogo({
      ...logoSettings,
      adjustments: {
        ...(logoSettings?.adjustments || {}),
        [key]: value
      }
    });
  };

  const resetAdjustment = (key) => {
    handleAdjustmentChange(key, 0);
  };

  const getLogoFilterStr = () => {
    const adj = logoSettings?.adjustments || {};
    const exposure = adj.exposure || 0;
    const contrast = adj.contrast || 0;
    const saturation = adj.saturation || 0;
    const temperature = adj.temperature || 0;
    const tint = adj.tint || 0;
    const highlights = (adj.highlights || 0) / 5;
    const shadows = (adj.shadows || 0) / 5;
    return `brightness(${100 + exposure}%) contrast(${100 + contrast}%) saturate(${100 + saturation}%) hue-rotate(${tint}deg) sepia(${temperature > 0 ? temperature : 0}%) brightness(${100 + highlights}%) contrast(${100 + shadows}%)`;
  };

  const getWatermarkFilterStr = () => {
    const adj = watermarkSettings?.adjustments || {};
    const exposure = adj.exposure || 0;
    const contrast = adj.contrast || 0;
    const saturation = adj.saturation || 0;
    const temperature = adj.temperature || 0;
    const tint = adj.tint || 0;
    const highlights = (adj.highlights || 0) / 5;
    const shadows = (adj.shadows || 0) / 5;
    return `brightness(${100 + exposure}%) contrast(${100 + contrast}%) saturate(${100 + saturation}%) hue-rotate(${tint}deg) sepia(${temperature > 0 ? temperature : 0}%) brightness(${100 + highlights}%) contrast(${100 + shadows}%)`;
  };

  const resetAllAdjustments = () => {
    onUpdateLogo({
      ...logoSettings,
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

  const handleModalFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const newImageData = { id: Date.now(), url: event.target.result };
      setUploadedImages((prev) => [newImageData, ...prev]);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };




  // Default Logo View
  return (
    <div className="flex flex-col h-full bg-white font-sans">
      {/* Sub-header */}
      <div className="h-[7.5vh] flex items-center justify-between px-[1.2vw] border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-[0.75vw] text-gray-800">
          <Icon icon="lucide:gem" className="w-[1.2vw] h-[1.2vw] text-black" />
          <h2 className="text-[1vw] font-semibold text-gray-900">Branding</h2>
        </div>
        <button
          onClick={onBack}
          className="w-[2vw] h-[2vw] rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-all active:scale-90"
        >
          <Icon icon="ph:arrow-left-bold" className="w-[1.1vw] h-[1.1vw]" />
        </button>
      </div>

      <style>{`
        .custom-range-slider { -webkit-appearance: none; width: 100%; background: transparent; position: relative; }
        .custom-range-slider::before { content: ""; position: absolute; top: -0.75vw; bottom: -0.75vw; left: 0; right: 0; cursor: pointer; z-index: 1; }
        .custom-range-slider::-webkit-slider-runnable-track { height: 0.2vw; border-radius: 0.1vw; background: inherit; }
        .custom-range-slider::-webkit-slider-thumb { -webkit-appearance: none; height: 1vw; width: 1vw; border-radius: 50%; background: #4D47FF; border: 0.02vw solid #ffffff; box-shadow: 0 0.15vw 0.5vw rgba(77,71,255,0.4); margin-top: -0.4vw; cursor: pointer; transition: box-shadow 0.15s ease; position: relative; z-index: 2; }
        .custom-range-slider::-webkit-slider-thumb:hover { box-shadow: 0 0.15vw 0.75vw rgba(77,71,255,0.6); }
        .custom-range-slider::-moz-range-track { height: 0.2vw; border-radius: 0.1vw; background: inherit; }
        .custom-range-slider::-moz-range-thumb { height: 1vw; width: 1vw; border-radius: 50%; background: #4D47FF; border: 0.02vw solid #ffffff; box-shadow: 0 0.15vw 0.5vw rgba(77,71,255,0.4); cursor: pointer; }
        .custom-range-slider::-moz-range-thumb:hover { box-shadow: 0 0.15vw 0.75vw rgba(77,71,255,0.6); }
      `}</style>

      <div className="flex-1 overflow-y-auto px-[1.2vw] pt-[1vw] pb-[3vw] flex flex-col gap-[1vw] hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {/* Upload your Logo Header */}
        <div className="mb-[0.5vw]">
          <div className="flex items-center gap-[0.5vw] mt-[0.5vw]">
            <span className="text-[0.85vw] font-semibold text-gray-900 whitespace-nowrap mb-[1vw]">Upload your Logo</span>
            <div className="h-[0.0925vw] bg-gray-200 flex-1"> </div>
            {logoSettings?.src && (
              <button
                onClick={() => setShowCropOverlay(true)}
                className="flex items-center justify-center h-[1.8vw] px-[0.8vw] bg-white hover:bg-gray-50 text-gray-700 text-[0.75vw] font-medium rounded-[0.4vw] border border-gray-200 transition-colors shadow-sm"
              >
                Crop
              </button>
            )}
          </div>

          {/* Split Upload / Drop Zone */}
          {logoSettings?.src ? (
            <div className="flex flex-col gap-[0.75vw]">
              <div
                className="flex items-center gap-[1vw]"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const file = e.dataTransfer.files[0];
                  if (file && file.type.startsWith('image/')) {
                    handleFileChange({ target: { files: [file] } });
                  }
                }}
              >
                {/* Thumbnail */}
                <div className="relative w-[8.5vw] h-[6vw] rounded-[0.4vw] overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center border border-gray-200">
                  <img
                    src={logoSettings.src}
                    alt="Thumbnail"
                    className={`w-full h-full ${logoSettings?.cropData ? 'object-cover' : 'object-contain'}`}
                    style={{
                      opacity: (logoSettings?.opacity ?? 100) / 100,
                      filter: getLogoFilterStr(),
                      ...(() => {
                        const cd = logoSettings?.cropData;
                        return cd && cd.inset ? {
                          clipPath: cd.inset,
                          WebkitClipPath: cd.inset,
                          transform: `translate(${cd.offX}%, ${cd.offY}%) scale(${cd.scale})`,
                          transformOrigin: 'center center'
                        } : {};
                      })()
                    }}
                  />
                </div>

                {/* Info & Actions */}
                <div className="flex flex-col flex-1 gap-[0.4vw] py-[0.2vw]">
                  <div className="flex flex-col gap-[0.1vw]">
                    <span className="text-[0.9vw] font-medium text-gray-700 truncate w-[10vw]" title="Logo">
                      Logo
                    </span>
                    <span className="text-[0.75vw] text-gray-400">
                      {logoResolution && logoFileSize ? `${logoResolution} • ${logoFileSize}` : (logoFileSize || logoResolution || 'Loading size...')}
                    </span>
                  </div>

                  <div className="flex items-center gap-[0.5vw]">
                    <button
                      onClick={() => setReplaceTarget('logo')}
                      className="px-[0.75vw] py-[0.4vw] bg-[#f3f4f6] hover:bg-[#e5e7eb] text-gray-700 text-[0.75vw] font-semibold rounded-[0.4vw] border border-gray-200 cursor-pointer transition-colors"
                    >
                      Replace image
                    </button>
                    <button
                      onClick={confirmRemoveLogo}
                      className="p-[0.45vw] bg-[#f3f4f6] hover:bg-[#fee2e2] text-gray-500 hover:text-red-500 rounded-[0.4vw] border border-gray-200 cursor-pointer transition-colors"
                    >
                      <Trash2 size="0.95vw" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Add URL */}
              <div className="flex flex-col gap-[0.4vw] pt-[0.5vw]">
                <span className="text-[0.75vw] font-semibold text-gray-700 whitespace-nowrap">Add URL :</span>
                <input
                  type="text"
                  value={logoSettings?.url || ''}
                  onChange={(e) => onUpdateLogo({ ...logoSettings, url: e.target.value })}
                  placeholder="https://"
                  className="w-full px-[0.8vw] py-[0.45vw] bg-white border border-gray-300 rounded-[0.4vw] text-[0.75vw] focus:ring-[0.0625vw] focus:ring-blue-500 focus:outline-none text-gray-700 shadow-sm"
                />
              </div>

              {/* Opacity Slider */}
              <div className="flex items-center gap-[1vw] py-[0.5vw]">
                <span className="text-[0.75vw] font-semibold text-gray-700 whitespace-nowrap">Opacity :</span>
                <div className="flex-1 flex items-center h-[1.5vw]">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={logoSettings?.opacity ?? 100}
                    onChange={(e) => onUpdateLogo({ ...logoSettings, opacity: parseInt(e.target.value) })}
                    className="w-full cursor-pointer custom-range-slider"
                    style={{
                      backgroundImage: `linear-gradient(to right, #4D47FF 0%, #4D47FF ${logoSettings?.opacity ?? 100}%, #E2E8F0 ${logoSettings?.opacity ?? 100}%, #E2E8F0 100%)`
                    }}
                  />
                </div>
                <div className="px-[0.6vw] py-[0.3vw] bg-white border border-gray-200 rounded-[0.4vw] text-[0.75vw] font-semibold text-gray-700 min-w-[3vw] text-center shadow-sm">
                  {logoSettings?.opacity ?? 100}%
                </div>
              </div>

              {/* Collapsible Adjustment Section */}
              <div className="flex flex-col">
                <div
                  onClick={() => setShowLogoAdjustments(!showLogoAdjustments)}
                  className={`w-full flex items-center justify-between px-[1vw] py-[1vw] bg-white border border-gray-200 shadow-sm cursor-pointer hover:bg-gray-50 transition-colors ${showLogoAdjustments ? 'rounded-t-[0.75vw] border-b-0' : 'rounded-[0.75vw]'}`}
                >
                  <span className="text-[0.75vw] font-semibold text-gray-700">Adjustments</span>
                  <ChevronDown
                    size="0.95vw"
                    className={`text-gray-500 transition-transform duration-200 ${showLogoAdjustments ? 'rotate-180' : ''}`}
                  />
                </div>

                {showLogoAdjustments && (
                  <div className="space-y-[0.1vw] border border-gray-200 rounded-b-[0.75vw] bg-white p-[0.5vw]">
                    <AdjustmentSlider
                      label="Exposure"
                      value={logoSettings?.adjustments?.exposure || 0}
                      onChange={(val) => handleAdjustmentChange('exposure', val)}
                      onReset={() => handleAdjustmentChange('exposure', 0)}
                    />
                    <AdjustmentSlider
                      label="Contrast"
                      value={logoSettings?.adjustments?.contrast || 0}
                      onChange={(val) => handleAdjustmentChange('contrast', val)}
                      onReset={() => handleAdjustmentChange('contrast', 0)}
                    />
                    <AdjustmentSlider
                      label="Saturation"
                      value={logoSettings?.adjustments?.saturation || 0}
                      onChange={(val) => handleAdjustmentChange('saturation', val)}
                      onReset={() => handleAdjustmentChange('saturation', 0)}
                    />
                    <AdjustmentSlider
                      label="Temperature"
                      value={logoSettings?.adjustments?.temperature || 0}
                      onChange={(val) => handleAdjustmentChange('temperature', val)}
                      onReset={() => handleAdjustmentChange('temperature', 0)}
                    />
                    <AdjustmentSlider
                      label="Tint"
                      value={logoSettings?.adjustments?.tint || 0}
                      onChange={(val) => handleAdjustmentChange('tint', val)}
                      onReset={() => handleAdjustmentChange('tint', 0)}
                    />
                    <AdjustmentSlider
                      label="Highlights"
                      value={logoSettings?.adjustments?.highlights || 0}
                      onChange={(val) => handleAdjustmentChange('highlights', val)}
                      onReset={() => handleAdjustmentChange('highlights', 0)}
                    />
                    <AdjustmentSlider
                      label="Shadows"
                      value={logoSettings?.adjustments?.shadows || 0}
                      onChange={(val) => handleAdjustmentChange('shadows', val)}
                      onReset={() => handleAdjustmentChange('shadows', 0)}
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-[0.75vw] mb-[1vw] ">
              {/* Drag & Drop Box */}
              <div
                onClick={() => setReplaceTarget('logo')}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const file = e.dataTransfer.files[0];
                  if (file && file.type.startsWith('image/')) {
                    handleFileChange({ target: { files: [file] } });
                  }
                }}
                className="w-full h-[7vw] border-2 border-dashed border-gray-400 rounded-[0.75vw] bg-white p-[0.9vw] flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:border-[#4c5add] hover:bg-gray-50/50 group shadow-sm"
              >
                <div className="flex items-center">
                  <span className="text-gray-500 text-[0.8vw] font-semibold">+ Add Logo</span>
                </div>
              </div>
            </div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
          />

          {/* Add Watermark Section */}
          <div className="mb-[0.5vw]">
            <div className="flex items-center gap-[0.5vw] mt-[1.5vw]">
              <span className="text-[0.85vw] font-semibold text-gray-900 whitespace-nowrap pb-[0.5vw]">Add Watermark</span>
              <div className="h-[0.0925vw] bg-gray-200 flex-1"> </div>
              {watermarkSettings?.src && (
                <button
                  onClick={() => setShowWatermarkCropOverlay(true)}
                  className="flex items-center justify-center h-[1.8vw] px-[0.8vw] bg-white hover:bg-gray-50 text-gray-700 text-[0.75vw] font-medium rounded-[0.4vw] border border-gray-200 transition-colors shadow-sm"
                >
                  Crop
                </button>
              )}
            </div>
          </div>

          {watermarkSettings?.src ? (
            <div className="flex flex-col gap-[0.5vw]">
              <div className="flex items-center gap-[1vw]">
                {/* Thumbnail */}
                <div className="relative w-[8.5vw] h-[6vw] rounded-[0.4vw] overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center border border-gray-200">
                  <img
                    src={watermarkSettings.src}
                    alt="Watermark Thumbnail"
                    className="w-full h-full object-contain"
                    style={{
                      filter: getWatermarkFilterStr(),
                      ...(() => {
                        const cd = watermarkSettings?.cropData;
                        return cd && cd.inset ? {
                          clipPath: cd.inset,
                          WebkitClipPath: cd.inset,
                          transform: `translate(${cd.offX}%, ${cd.offY}%) scale(${cd.scale})`,
                          transformOrigin: 'center center'
                        } : {};
                      })()
                    }}
                  />
                </div>

                {/* Info & Actions */}
                <div className="flex flex-col flex-1 gap-[0.4vw] py-[0.2vw]">
                  <div className="flex flex-col gap-[0.1vw]">
                    <span className="text-[0.9vw] font-medium text-gray-700 truncate w-[10vw]">
                      Watermark
                    </span>
                    <span className="text-[0.75vw] text-gray-400">
                      {watermarkResolution && watermarkFileSize ? `${watermarkResolution} • ${watermarkFileSize}` : (watermarkFileSize || watermarkResolution || 'Loading size...')}
                    </span>
                  </div>
                  <div className="flex items-center gap-[0.5vw]">
                    <button
                      onClick={() => setReplaceTarget('watermark')}
                      className="px-[0.75vw] py-[0.4vw] bg-[#f3f4f6] hover:bg-[#e5e7eb] text-gray-700 text-[0.75vw] font-semibold rounded-[0.4vw] border border-gray-200 cursor-pointer transition-colors"
                    >
                      Replace image
                    </button>
                    <button
                      onClick={() => setDeleteTarget('watermark')}
                      className="p-[0.45vw] bg-[#f3f4f6] hover:bg-[#fee2e2] text-gray-500 hover:text-red-500 rounded-[0.4vw] border border-gray-200 cursor-pointer transition-colors"
                    >
                      <Trash2 size="0.95vw" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-[0.75vw] mb-[1vw]">
              {/* Drag & Drop Box */}
              <div
                onClick={() => setReplaceTarget('watermark')}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const file = e.dataTransfer.files[0];
                  if (file && file.type.startsWith('image/')) {
                    handleWatermarkReplace(file);
                  }
                }}
                className="w-full h-[7vw] border-2 border-dashed border-gray-400 rounded-[0.75vw] bg-white p-[0.9vw] flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:border-[#4c5add] hover:bg-gray-50/50 group shadow-sm"
              >
                <div className="flex items-center">
                  <span className="text-gray-500 text-[0.8vw] font-semibold">+ Add Watermark</span>
                </div>
              </div>
            </div>
          )}

          <input
            type="file"
            ref={watermarkFileInputRef}
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                handleWatermarkReplace(file);
              }
            }}
            className="hidden"
            accept="image/*"
          />          {/* Watermark Options */}
          {watermarkSettings?.src && (
            <div className="flex gap-[2vw] pt-[1.5vw] pb-[1vw]">
              <style>{`
              .custom-range-slider { -webkit-appearance: none; width: 100%; background: transparent; position: relative; }
              .custom-range-slider::before { content: ""; position: absolute; top: -0.75vw; bottom: -0.75vw; left: 0; right: 0; cursor: pointer; z-index: 1; }
              .custom-range-slider::-webkit-slider-runnable-track { height: 0.15vw; border-radius: 0.1vw; background: inherit; }
              .custom-range-slider::-webkit-slider-thumb { -webkit-appearance: none; height: 1vw; width: 1vw; border-radius: 50%; background: #4D47FF; cursor: pointer; position: relative; z-index: 2; margin-top: -0.4vw; }
            `}</style>

              {/* Left Column: Sliders */}
              <div className="flex-1 flex flex-col gap-[1vw]">
                {/* Scale */}
                <div className="flex flex-col gap-[0.4vw]">
                  <div className="flex items-center gap-[0.5vw]">
                    <span className="text-[0.85vw] text-gray-800">Scale :</span>
                    <div className="px-[0.2vw] py-[0.1vw] bg-white border border-gray-100 rounded-[0.2vw] text-[0.8vw] font-medium text-gray-800 shadow-sm min-w-[2.5vw] text-center">
                      {watermarkSettings?.scale ?? 100}%
                    </div>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={200}
                    value={watermarkSettings?.scale ?? 100}
                    onChange={(e) => onUpdateWatermark({ ...watermarkSettings, scale: parseInt(e.target.value) })}
                    className="w-full cursor-pointer custom-range-slider mt-[0.2vw]"
                    style={{ backgroundImage: `linear-gradient(to right, #4D47FF 0%, #4D47FF ${(watermarkSettings?.scale ?? 100) / 2}%, #E2E8F0 ${(watermarkSettings?.scale ?? 100) / 2}%, #E2E8F0 100%)` }}
                  />
                </div>

                {/* Rotate */}
                <div className="flex flex-col gap-[0.4vw]">
                  <div className="flex items-center gap-[0.5vw]">
                    <span className="text-[0.85vw] text-gray-800">Rotate :</span>
                    <div className="px-[0.2vw] py-[0.1vw] bg-white border border-gray-100 rounded-[0.2vw] text-[0.8vw] font-medium text-gray-800 shadow-sm min-w-[2.5vw] text-center">
                      {watermarkSettings?.rotate ?? 0}&deg;
                    </div>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={360}
                    value={watermarkSettings?.rotate ?? 0}
                    onChange={(e) => onUpdateWatermark({ ...watermarkSettings, rotate: parseInt(e.target.value) })}
                    className="w-full cursor-pointer custom-range-slider mt-[0.2vw]"
                    style={{ backgroundImage: `linear-gradient(to right, #4D47FF 0%, #4D47FF ${(watermarkSettings?.rotate ?? 0) / 3.6}%, #E2E8F0 ${(watermarkSettings?.rotate ?? 0) / 3.6}%, #E2E8F0 100%)` }}
                  />
                </div>

                {/* Opacity */}
                <div className="flex flex-col gap-[0.4vw]">
                  <div className="flex items-center gap-[0.5vw]">
                    <span className="text-[0.85vw] text-gray-800">Opacity :</span>
                    <div className="px-[0.2vw] py-[0.1vw] bg-white border border-gray-100 rounded-[0.2vw] text-[0.8vw] font-medium text-gray-800 shadow-sm min-w-[2.5vw] text-center">
                      {watermarkSettings?.opacity ?? 100}%
                    </div>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={watermarkSettings?.opacity ?? 100}
                    onChange={(e) => onUpdateWatermark({ ...watermarkSettings, opacity: parseInt(e.target.value) })}
                    className="w-full cursor-pointer custom-range-slider mt-[0.2vw]"
                    style={{ backgroundImage: `linear-gradient(to right, #4D47FF 0%, #4D47FF ${watermarkSettings?.opacity ?? 100}%, #E2E8F0 ${watermarkSettings?.opacity ?? 100}%, #E2E8F0 100%)` }}
                  />
                </div>
              </div>

              {/* Right Column: Position D-Pad */}
              <div className="flex-[1.2] flex flex-col gap-[0.5vw]">
                <span className="text-[0.85vw] text-gray-800 mb-[0.2vw]">Position :</span>
                <div className="flex gap-[0.4vw] items-stretch h-[7.5vw]">
                  {/* Left */}
                  <button 
                    onPointerDown={(e) => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); startMove(-5, 0); }}
                    onPointerUp={(e) => { stopMove(); e.currentTarget.releasePointerCapture(e.pointerId); }}
                    onPointerCancel={stopMove}
                    onContextMenu={(e) => e.preventDefault()}
                    className="w-[2vw] bg-white border border-gray-200 rounded-[0.3vw] flex items-center justify-center hover:bg-gray-50 text-gray-500 shadow-sm select-none"
                    style={{ touchAction: 'none' }}
                  >
                    <ChevronDown className="w-[1.2vw] h-[1.2vw] rotate-90" />
                  </button>

                  {/* Center Column */}
                  <div className="flex-1 flex flex-col gap-[0.4vw]">
                    <button 
                      onPointerDown={(e) => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); startMove(0, -5); }}
                      onPointerUp={(e) => { stopMove(); e.currentTarget.releasePointerCapture(e.pointerId); }}
                      onPointerCancel={stopMove}
                      onContextMenu={(e) => e.preventDefault()}
                      className="flex-1 bg-white border border-gray-200 rounded-[0.3vw] flex items-center justify-center hover:bg-gray-50 text-gray-500 shadow-sm select-none"
                      style={{ touchAction: 'none' }}
                    >
                      <ChevronDown className="w-[1.2vw] h-[1.2vw] rotate-180" />
                    </button>
                    <div className="flex-1 flex items-center justify-center text-[0.75vw] text-gray-400 font-medium">
                      Move
                    </div>
                    <button 
                      onPointerDown={(e) => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); startMove(0, 5); }}
                      onPointerUp={(e) => { stopMove(); e.currentTarget.releasePointerCapture(e.pointerId); }}
                      onPointerCancel={stopMove}
                      onContextMenu={(e) => e.preventDefault()}
                      className="flex-1 bg-white border border-gray-200 rounded-[0.3vw] flex items-center justify-center hover:bg-gray-50 text-gray-500 shadow-sm select-none"
                      style={{ touchAction: 'none' }}
                    >
                      <ChevronDown className="w-[1.2vw] h-[1.2vw]" />
                    </button>
                  </div>

                  {/* Right */}
                  <button 
                    onPointerDown={(e) => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); startMove(5, 0); }}
                    onPointerUp={(e) => { stopMove(); e.currentTarget.releasePointerCapture(e.pointerId); }}
                    onPointerCancel={stopMove}
                    onContextMenu={(e) => e.preventDefault()}
                    className="w-[2vw] bg-white border border-gray-200 rounded-[0.3vw] flex items-center justify-center hover:bg-gray-50 text-gray-500 shadow-sm select-none"
                    style={{ touchAction: 'none' }}
                  >
                    <ChevronDown className="w-[1.2vw] h-[1.2vw] -rotate-90" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Preloader Customization Section */}
          <div className="flex items-center gap-[1vw] mb-[0.5vw] mt-[1.5vw]">
            <span className="text-[0.85vw] font-semibold text-gray-900 whitespace-nowrap pb-[0.5vw]">Preloaded Customization</span>
            <div className="h-[0.0925vw] bg-gray-200 flex-1"> </div>
          </div>

          {/* Interactive Preloader Preview Box */}
          {(() => {
            const displayPreloader = showPreloaderModal
              ? { ...preloaderSettings, ...tempPreloaderSettings }
              : (preloaderSettings || {});
            return (
              <div
                className="relative w-full h-[8vw] rounded-[1vw] flex flex-col items-center justify-center shadow-md border border-white/10 group overflow-hidden flex-shrink-0"
                style={{
                  backgroundColor: displayPreloader?.bgColor || '#D6E0F4',
                  color: displayPreloader?.textColor || '#ffffff'
                }}
              >
                {/* Swap Layout Button / Popup trigger */}
                <button
                  onClick={handleOpenPreloaderModal}
                  className="absolute top-[0.75vw] right-[0.75vw] p-[0.4vw] rounded-full bg-black/40 hover:bg-black/60 text-white cursor-pointer transition-colors flex items-center justify-center z-[20]"
                  title="Change preloader settings"
                >
                  <Icon icon="lucide:edit-2" className="w-[0.95vw] h-[0.95vw]" />
                </button>

                <div className="flex flex-col items-center gap-[0.8vw]">
                  {displayPreloader?.layout !== 'spinner' && displayPreloader?.logo && (
                    <img src={displayPreloader.logo} alt="Preloader Logo" className="h-[2.5vw] object-contain" />
                  )}
                  {displayPreloader?.layout === 'bar' ? (
                    <div className="flex flex-col items-center gap-2 w-[12vw]">
                      <div className="w-full bg-gray-600/40 h-[0.4vw] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: '40%',
                            backgroundColor: displayPreloader?.spinnerColor || '#3B3C8A'
                          }}
                        ></div>
                      </div>
                      {displayPreloader?.showPercentage && (
                        <span className="text-[0.7vw] font-semibold">0%</span>
                      )}
                    </div>
                  ) : displayPreloader?.layout === 'dots' ? (
                    <div className="flex flex-col items-center gap-[0.3vw] py-[0.3vw]">
                      <div className="flex items-center gap-[0.4vw]">
                        <div className="w-[0.5vw] h-[0.5vw] rounded-full" style={{ backgroundColor: displayPreloader?.spinnerColor || '#3B3C8A' }}></div>
                        <div className="w-[0.5vw] h-[0.5vw] rounded-full" style={{ backgroundColor: displayPreloader?.spinnerColor || '#3B3C8A' }}></div>
                        <div className="w-[0.5vw] h-[0.5vw] rounded-full" style={{ backgroundColor: displayPreloader?.spinnerColor || '#3B3C8A' }}></div>
                      </div>
                      {displayPreloader?.showPercentage && (
                        <span className="text-[0.7vw] font-semibold">0%</span>
                      )}
                    </div>
                  ) : (
                    // default circular spinner
                    <div className="relative flex flex-col items-center justify-center">
                      <div className="relative flex items-center justify-center">
                        <div
                          className={`${displayPreloader?.logo ? 'w-[4vw] h-[4vw]' : 'w-[2.2vw] h-[2.2vw]'} border-[3px] border-t-transparent rounded-full`}
                          style={{
                            borderColor: `${displayPreloader?.spinnerColor || '#3B3C8A'} ${displayPreloader?.spinnerColor || '#3B3C8A'} ${displayPreloader?.spinnerColor || '#3B3C8A'} transparent`
                          }}
                        ></div>
                        {displayPreloader?.logo && (
                          <img src={displayPreloader.logo} alt="Preloader Logo" className="absolute h-[2vw] max-w-[2.8vw] object-contain" />
                        )}
                        {displayPreloader?.showPercentage && !displayPreloader?.logo && (
                          <span className="absolute text-[0.6vw] font-bold">0%</span>
                        )}
                      </div>
                      {displayPreloader?.showPercentage && displayPreloader?.logo && (
                        <span className="text-[0.6vw] font-bold mt-[0.3vw]">0%</span>
                      )}
                    </div>
                  )}
                  <p
                    className="text-[0.75vw] font-semibold text-center truncate max-w-[15vw]"
                    style={{ fontFamily: displayPreloader?.font || 'Poppins' }}
                  >
                    {displayPreloader?.text || 'Loading Modal Please Wait....'}
                  </p>
                </div>
              </div>
            );
          })()}

          {/* Preloader Styles Modal */}
          {showPreloaderModal && typeof document !== 'undefined' && createPortal(
            <div
              className="fixed w-[22vw] z-[9999] bg-white rounded-[0.8vw] shadow-[0_4px_30px_rgba(0,0,0,0.2)] border border-gray-200 overflow-hidden"
              style={{
                top: '50%',
                left: '48vw',
                transform: 'translate(-50%, -50%)',
                maxHeight: '90vh',
                overflowY: 'auto'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-[1.2vw] space-y-[1.2vw]">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <h4 className="text-[1.1vw] font-semibold text-black">Preloaded Customization</h4>
                  <button onClick={() => {
                      onUpdatePreloader({ ...(preloaderSettings || {}), ...(tempPreloaderSettings || {}) });
                      setShowPreloaderModal(false);
                  }} className="text-gray-500 hover:text-gray-800 focus:outline-none">
                    <Icon icon="lucide:x" className="w-[1.2vw] h-[1.2vw]" />
                  </button>
                </div>

                {/* Add Logo and Preloader Style */}
                <div className="grid grid-cols-2 gap-[1vw]">
                  <div className="flex flex-col gap-[0.4vw]">
                    <span className="text-[0.85vw] font-medium text-gray-800">Add Logo</span>
                    <button 
                      onClick={() => setReplaceTarget('preloaderLogo')}
                      className="h-[3vw] rounded-[0.5vw] border border-dashed border-gray-400 bg-gray-50 flex items-center justify-center gap-[0.4vw] text-gray-500 hover:bg-gray-100 transition-colors focus:outline-none"
                    >
                      {tempPreloaderSettings?.logo ? (
                        <img src={tempPreloaderSettings.logo} alt="Preloader Logo" className="h-[2vw] object-contain" />
                      ) : (
                        <>
                          <Icon icon="lucide:plus" className="w-[1vw] h-[1vw]" />
                          <span className="text-[0.8vw]">Add logo</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="flex flex-col gap-[0.4vw]">
                    <span className="text-[0.85vw] font-medium text-gray-800">Preloader Style</span>
                    <div className="relative">
                      <button 
                        onClick={() => setShowStyleDropdown(!showStyleDropdown)}
                        className="w-full h-[3vw] rounded-[0.5vw] border border-gray-200 bg-white flex items-center justify-between px-[1vw] hover:bg-gray-50 transition-colors focus:outline-none"
                      >
                        <div className="flex items-center gap-[0.5vw]">
                          {(!tempPreloaderSettings?.layout || tempPreloaderSettings.layout === 'spinner') && (
                            <Icon icon="lucide:loader-2" className="w-[1.2vw] h-[1.2vw] text-gray-600" />
                          )}
                          {tempPreloaderSettings?.layout === 'bar' && (
                            <div className="w-[1.5vw] h-[0.3vw] bg-gray-600 rounded-full" />
                          )}
                          {tempPreloaderSettings?.layout === 'dots' && (
                            <div className="flex gap-[0.2vw]">
                              <div className="w-[0.3vw] h-[0.3vw] bg-gray-600 rounded-full" />
                              <div className="w-[0.3vw] h-[0.3vw] bg-gray-600 rounded-full" />
                              <div className="w-[0.3vw] h-[0.3vw] bg-gray-600 rounded-full" />
                            </div>
                          )}
                        </div>
                        <Icon icon="lucide:arrow-right-left" className="w-[0.9vw] h-[0.9vw] text-gray-500" />
                      </button>
                      
                      {showStyleDropdown && (
                        <div className="absolute top-full mt-[0.2vw] left-0 w-full bg-white border border-gray-200 rounded-[0.4vw] shadow-lg z-[100] overflow-hidden">
                          {['spinner', 'bar', 'dots'].map(layout => (
                            <div 
                              key={layout}
                              className={`px-[1vw] py-[0.6vw] flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors ${tempPreloaderSettings?.layout === layout ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700'}`}
                              onClick={() => {
                                setTempPreloaderSettings({ ...tempPreloaderSettings, layout });
                                setShowStyleDropdown(false);
                              }}
                            >
                              <span className="text-[0.8vw] font-medium capitalize">{layout}</span>
                              {layout === 'spinner' && <Icon icon="lucide:loader-2" className="w-[1vw] h-[1vw]" />}
                              {layout === 'bar' && <div className="w-[1vw] h-[0.2vw] bg-current rounded-full" />}
                              {layout === 'dots' && (
                                <div className="flex gap-[0.15vw]">
                                  <div className="w-[0.2vw] h-[0.2vw] bg-current rounded-full" />
                                  <div className="w-[0.2vw] h-[0.2vw] bg-current rounded-full" />
                                  <div className="w-[0.2vw] h-[0.2vw] bg-current rounded-full" />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Preloader text */}
                <div className="flex flex-col gap-[0.4vw]">
                  <span className="text-[0.85vw] font-medium text-gray-800">Preloader text</span>
                  <input
                    type="text"
                    placeholder="Enter text"
                    value={tempPreloaderSettings?.text || ''}
                    onChange={(e) => setTempPreloaderSettings({ ...tempPreloaderSettings, text: e.target.value })}
                    className="w-full px-[0.8vw] py-[0.5vw] bg-white border border-gray-200 rounded-[0.4vw] text-[0.8vw] focus:outline-none focus:border-indigo-500 text-gray-700"
                  />
                  <div className="grid grid-cols-2 gap-[0.5vw] mt-[0.2vw]">
                    <PremiumDropdown
                      options={fontFamilies}
                      value={tempPreloaderSettings?.font || 'Poppins'}
                      onChange={(val) => setTempPreloaderSettings({ ...tempPreloaderSettings, font: val })}
                      width="100%"
                      isFont={true}
                    />
                    <PremiumDropdown
                      options={['10','12','14','16','18','20','24']}
                      value={tempPreloaderSettings?.fontSize || '14'}
                      onChange={(val) => setTempPreloaderSettings({ ...tempPreloaderSettings, fontSize: val })}
                      width="100%"
                    />
                  </div>
                </div>

                {/* Loading Percentage */}
                <div className="flex flex-col gap-[0.4vw]">
                  <div className="flex items-center justify-between">
                    <span className="text-[0.85vw] font-medium text-gray-800">Loading Percentage</span>
                    <button
                      onClick={() => setTempPreloaderSettings({ ...tempPreloaderSettings, showPercentage: !tempPreloaderSettings?.showPercentage })}
                      className={`w-[2.2vw] h-[1.2vw] rounded-full p-[0.1vw] transition-colors focus:outline-none ${tempPreloaderSettings?.showPercentage ? 'bg-[#4A3AFF]' : 'bg-gray-200 border border-gray-300'}`}
                    >
                      <div className={`w-[1vw] h-[1vw] rounded-full bg-white shadow-sm transition-transform ${tempPreloaderSettings?.showPercentage ? 'translate-x-[1vw]' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-[0.5vw] mt-[0.2vw]">
                    <PremiumDropdown
                      options={fontFamilies}
                      value={tempPreloaderSettings?.percentageFont || 'Poppins'}
                      onChange={(val) => setTempPreloaderSettings({ ...tempPreloaderSettings, percentageFont: val })}
                      width="100%"
                      isFont={true}
                    />
                    <PremiumDropdown
                      options={['10','12','14','16','18','20','24']}
                      value={tempPreloaderSettings?.percentageFontSize || '14'}
                      onChange={(val) => setTempPreloaderSettings({ ...tempPreloaderSettings, percentageFontSize: val })}
                      width="100%"
                    />
                  </div>
                </div>

                {/* Preloader Colors */}
                <div className="flex flex-col gap-[0.6vw]">
                  <span className="text-[0.85vw] font-medium text-gray-800">Preloader Colors</span>
                  
                  {/* Text Color */}
                  <div className="flex items-center gap-[1vw]">
                    <span className="text-[0.8vw] font-medium text-gray-800 w-[5vw]">Text Color :</span>
                    <div
                      className="w-[1.8vw] h-[1.8vw] rounded-[0.4vw] border border-gray-200 cursor-pointer shadow-sm hover:border-indigo-400"
                      style={{ backgroundColor: tempPreloaderSettings?.textColor || '#ffffff' }}
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setPickerPos({ x: Math.min(window.innerWidth - 260, rect.left + 260), y: rect.top });
                        setShowPreloaderTextColorPicker(true);
                      }}
                    />
                    <div className="flex-1 flex items-center justify-between border border-gray-300 rounded-[0.4vw] px-[0.6vw] py-[0.4vw] bg-white">
                      <input
                        type="text"
                        value={(tempPreloaderSettings?.textColor || '#ffffff').toUpperCase()}
                        onChange={(e) => {
                          let val = e.target.value;
                          if (!val.startsWith('#')) val = '#' + val;
                          setTempPreloaderSettings({ ...tempPreloaderSettings, textColor: val });
                        }}
                        className="text-[0.8vw] text-gray-600 font-mono bg-transparent w-full outline-none"
                      />
                      <span className="text-[0.8vw] text-gray-500 font-mono ml-2">100%</span>
                    </div>
                  </div>

                  {/* Bg Color */}
                  <div className="flex items-center gap-[1vw]">
                    <span className="text-[0.8vw] font-medium text-gray-800 w-[5vw]">Bg Color :</span>
                    <div
                      className="w-[1.8vw] h-[1.8vw] rounded-[0.4vw] border border-gray-200 cursor-pointer shadow-sm hover:border-indigo-400"
                      style={{ backgroundColor: tempPreloaderSettings?.bgColor || '#2F91FD' }}
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setPickerPos({ x: Math.min(window.innerWidth - 260, rect.left + 260), y: rect.top });
                        setShowPreloaderBgColorPicker(true);
                      }}
                    />
                    <div className="flex-1 flex items-center justify-between border border-gray-300 rounded-[0.4vw] px-[0.6vw] py-[0.4vw] bg-white">
                      <input
                        type="text"
                        value={(tempPreloaderSettings?.bgColor || '#2F91FD').toUpperCase()}
                        onChange={(e) => {
                          let val = e.target.value;
                          if (!val.startsWith('#')) val = '#' + val;
                          setTempPreloaderSettings({ ...tempPreloaderSettings, bgColor: val });
                        }}
                        className="text-[0.8vw] text-gray-600 font-mono bg-transparent w-full outline-none"
                      />
                      <span className="text-[0.8vw] text-gray-500 font-mono ml-2">100%</span>
                    </div>
                  </div>

                  {/* Accent Color */}
                  <div className="flex items-center gap-[1vw]">
                    <span className="text-[0.8vw] font-medium text-gray-800 w-[5vw]">Accent :</span>
                    <div
                      className="w-[1.8vw] h-[1.8vw] rounded-[0.4vw] border border-gray-200 cursor-pointer shadow-sm hover:border-indigo-400"
                      style={{ backgroundColor: tempPreloaderSettings?.spinnerColor || '#2F91FD' }}
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setPickerPos({ x: Math.min(window.innerWidth - 260, rect.left + 260), y: rect.top });
                        setShowPreloaderSpinnerColorPicker(true);
                      }}
                    />
                    <div className="flex-1 flex items-center justify-between border border-gray-300 rounded-[0.4vw] px-[0.6vw] py-[0.4vw] bg-white">
                      <input
                        type="text"
                        value={(tempPreloaderSettings?.spinnerColor || '#2F91FD').toUpperCase()}
                        onChange={(e) => {
                          let val = e.target.value;
                          if (!val.startsWith('#')) val = '#' + val;
                          setTempPreloaderSettings({ ...tempPreloaderSettings, spinnerColor: val });
                        }}
                        className="text-[0.8vw] text-gray-600 font-mono bg-transparent w-full outline-none"
                      />
                      <span className="text-[0.8vw] text-gray-500 font-mono ml-2">100%</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>,
            document.body
          )}

        </div>

        {/* Gallery Modal */}
        {galleryTarget && (
          <div className="fixed z-[1000] bg-white border border-gray-100 rounded-[12px] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200" style={{ width: '320px', height: '540px', top: '50%', left: '24vw', transform: 'translate(-50%, -50%)' }}>
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
              <h2 className="text-ms font-semibold text-gray-900">Image Gallery</h2>
              <button onClick={() => { setGalleryTarget(null); setLocalGallerySelected(null); }} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                <Icon icon="lucide:x" className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="px-4 py-2">
              <h3 className="text-[13px] font-semibold text-gray-900 mb-1">
                Upload your {galleryTarget === 'logo' ? 'Logo' : 'Watermark'}
              </h3>
              <p className="text-[11px] text-gray-400 mb-4">
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

            <div className="custom-scrollbar overflow-y-auto max-h-[250px] px-4 py-2 flex-1">
              <h3 className="text-[13px] font-semibold text-gray-900 mb-1">
                Uploaded {galleryTarget === 'logo' ? 'Logos' : 'Watermarks'}
              </h3>
              {uploadedImages.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {uploadedImages.map((img, index) => (
                    <div key={img.id || index} className="group cursor-pointer flex flex-col items-center" onClick={() => setLocalGallerySelected(img)}>
                      <div className={`aspect-square w-full rounded-lg overflow-hidden border-2 transition-all ${localGallerySelected?.url === img.url ? 'border-indigo-600 shadow-md scale-[1.02]' : 'hover:border-indigo-400 border-gray-100'}`}>
                        <img src={img.url} className="w-full h-full object-cover" alt="" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-sm">No uploaded images yet</p>
                </div>
              )}
            </div>

            <div className="p-3 border-t flex justify-end gap-2 bg-white mt-auto">
              <button onClick={() => { setGalleryTarget(null); setLocalGallerySelected(null); }} className="flex-1 h-8 border border-gray-300 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 hover:bg-gray-50">
                <Icon icon="lucide:x" className="w-4 h-4" /> Close
              </button>
              <button
                onClick={() => {
                  if (localGallerySelected && galleryTarget) {
                    if (galleryTarget === 'logo') {
                      onUpdateLogo({ ...logoSettings, src: localGallerySelected.url, url: localGallerySelected.url });
                    } else if (galleryTarget === 'watermark') {
                      onUpdateWatermark({ ...watermarkSettings, src: localGallerySelected.url });
                    }
                    setGalleryTarget(null);
                    setLocalGallerySelected(null);
                  }
                }}
                disabled={!localGallerySelected}
                className={`flex-1 h-8 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${localGallerySelected ? 'bg-black text-white hover:bg-zinc-800' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
              >
                <Icon icon="lucide:check" className="w-4 h-4" /> Place
              </button>
            </div>
          </div>
        )}

        {/* Crop Overlay */}
        {showCropOverlay && logoSettings?.src && (
          <ImageCropOverlay
            imageSrc={logoSettings.src}
            element={null}
            onSave={(cropData) => {
              onUpdateLogo({ ...logoSettings, cropData });
              setShowCropOverlay(false);
            }}
            onCancel={() => setShowCropOverlay(false)}
          />
        )}

        {showWatermarkCropOverlay && watermarkSettings?.src && (
          <ImageCropOverlay
            imageSrc={watermarkSettings.src}
            element={null}
            onSave={(cropData) => {
              onUpdateWatermark({ ...watermarkSettings, cropData });
              setShowWatermarkCropOverlay(false);
            }}
            onCancel={() => setShowWatermarkCropOverlay(false)}
          />
        )}

        {showPreloaderBgColorPicker && (
          <CustomColorPicker
            color={showPreloaderModal ? (tempPreloaderSettings?.bgColor || '#2D2F33') : (preloaderSettings?.bgColor || '#2D2F33')}
            onChange={(color) => {
              if (showPreloaderModal) {
                setTempPreloaderSettings({ ...tempPreloaderSettings, bgColor: color });
              } else {
                onUpdatePreloader({ ...preloaderSettings, bgColor: color });
              }
            }}
            onClose={() => setShowPreloaderBgColorPicker(false)}
            position={pickerPos}
          />
        )}

        {showPreloaderTextColorPicker && (
          <CustomColorPicker
            color={showPreloaderModal ? (tempPreloaderSettings?.textColor || '#ffffff') : (preloaderSettings?.textColor || '#ffffff')}
            onChange={(color) => {
              if (showPreloaderModal) {
                setTempPreloaderSettings({ ...tempPreloaderSettings, textColor: color });
              } else {
                onUpdatePreloader({ ...preloaderSettings, textColor: color });
              }
            }}
            onClose={() => setShowPreloaderTextColorPicker(false)}
            position={pickerPos}
          />
        )}

        {showPreloaderSpinnerColorPicker && (
          <CustomColorPicker
            color={showPreloaderModal ? (tempPreloaderSettings?.spinnerColor || '#3B3C8A') : (preloaderSettings?.spinnerColor || '#3B3C8A')}
            onChange={(color) => {
              if (showPreloaderModal) {
                setTempPreloaderSettings({ ...tempPreloaderSettings, spinnerColor: color });
              } else {
                onUpdatePreloader({ ...preloaderSettings, spinnerColor: color });
              }
            }}
            onClose={() => setShowPreloaderSpinnerColorPicker(false)}
            position={pickerPos}
          />
        )}

        {replaceTarget && (
          <ReplaceMediaModal
            show={!!replaceTarget}
            size="small"
            titleText="Add Image"
            buttonText="Add Image"
            onClose={() => setReplaceTarget(null)}
            onReplace={(file) => {
              if (replaceTarget === 'logo') {
                handleLogoReplace(file);
              } else if (replaceTarget === 'watermark') {
                handleWatermarkReplace(file);
              } else if (replaceTarget === 'preloaderLogo') {
                handlePreloaderLogoReplace(file);
              }
            }}
            mediaType="image"
          />
        )}

        <AlertModal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => {
            if (deleteTarget === 'logo') removeLogo();
            else if (deleteTarget === 'watermark') removeWatermark();
          }}
          type="warning"
          title="Delete Image"
          message="Are you sure you want to delete this image? This action cannot be undone."
          showCancel={true}
          confirmText="Delete"
          cancelText="Cancel"
        />
      </div>
    </div>
  );
};

export default Branding;
