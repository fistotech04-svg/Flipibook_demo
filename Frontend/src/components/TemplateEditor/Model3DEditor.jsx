import React, { useEffect, useState, useRef } from 'react';
import { Icon } from '@iconify/react';
import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import QRCodeStyling from 'qr-code-styling';
import ColorPicker from './ColorPicker';
import axios from 'axios';

export const CustomQRCode = React.forwardRef(({ 
    value,  
    size = 256, 
    margin,
    fgColor = '#000000', 
    bgColor = '#ffffff', 
    dotType = 'square', 
    cornerSquareType = 'square', 
    cornerDotType = 'square', 
    level = 'M', 
    logo = '',
    style = {}
}, ref) => {
    const containerRef = useRef(null);
    const qrStylingRef = useRef(null);

    useEffect(() => {
        const qrCode = new QRCodeStyling({
            type: 'svg',
            width: size,
            height: size,
            data: value || 'https://google.com',
            margin: margin !== undefined ? margin : Math.max(2, Math.round(size * 0.05)),
            dotsOptions: {
                color: fgColor,
                type: dotType
            },
            backgroundOptions: {
                color: bgColor === 'transparent' ? 'rgba(0,0,0,0)' : bgColor
            },
            cornersSquareOptions: {
                color: fgColor,
                type: cornerSquareType
            },
            cornersDotOptions: {
                color: fgColor,
                type: cornerDotType
            },
            qrOptions: {
                errorCorrectionLevel: level
            },
            imageOptions: {
                crossOrigin: 'anonymous',
                margin: Math.round(size * 0.03),
                hideBackgroundDots: true
            },
            image: logo || undefined
        });

        qrStylingRef.current = qrCode;

        if (containerRef.current) {
            containerRef.current.innerHTML = '';
            qrCode.append(containerRef.current);
        }

        return () => {
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }
        };
    }, []);

    useEffect(() => {
        if (!qrStylingRef.current) return;

        const animFrame = requestAnimationFrame(() => {
            qrStylingRef.current.update({
                type: 'svg',
                width: size,
                height: size,
                data: value || 'https://google.com',
                margin: margin !== undefined ? margin : Math.max(2, Math.round(size * 0.05)),
                dotsOptions: {
                    color: fgColor,
                    type: dotType
                },
                backgroundOptions: {
                    color: bgColor === 'transparent' ? 'rgba(0,0,0,0)' : bgColor
                },
                cornersSquareOptions: {
                    color: fgColor,
                    type: cornerSquareType
                },
                cornersDotOptions: {
                    color: fgColor,
                    type: cornerDotType
                },
                qrOptions: {
                    errorCorrectionLevel: level
                },
                imageOptions: {
                    crossOrigin: 'anonymous',
                    margin: Math.round(size * 0.03),
                    hideBackgroundDots: true
                },
                image: logo || undefined
            });
        });

        return () => cancelAnimationFrame(animFrame);
    }, [value, size, margin, fgColor, bgColor, dotType, cornerSquareType, cornerDotType, level, logo]);

    React.useImperativeHandle(ref, () => ({
        download: async (options = {}) => {
            if (qrStylingRef.current) {
                try {
                    const ext = options.extension || 'png';
                    const downloadSize = options.size || 1024;
                    const resolvedBgColor = bgColor === 'transparent' ? 'rgba(0,0,0,0)' : bgColor;

                    qrStylingRef.current.update({
                        type: ext === 'svg' ? 'svg' : 'canvas',
                        width: downloadSize,
                        height: downloadSize,
                        data: value || 'https://google.com',
                        margin: margin !== undefined ? margin : Math.max(2, Math.round(downloadSize * 0.05)),
                        dotsOptions: {
                            color: fgColor,
                            type: dotType
                        },
                        backgroundOptions: {
                            color: resolvedBgColor
                        },
                        cornersSquareOptions: {
                            color: fgColor,
                            type: cornerSquareType
                        },
                        cornersDotOptions: {
                            color: fgColor,
                            type: cornerDotType
                        },
                        qrOptions: {
                            errorCorrectionLevel: level || 'L'
                        },
                        imageOptions: {
                            crossOrigin: 'anonymous',
                            margin: Math.round(downloadSize * 0.03),
                            hideBackgroundDots: true
                        },
                        image: logo || undefined
                    });

                    await qrStylingRef.current.download({
                        name: options.name || 'ar-qr-code',
                        extension: ext
                    });

                    qrStylingRef.current.update({ type: 'svg' });
                } catch (e) {
                    console.error('Error downloading QR code via qr-code-styling:', e);
                }
            }
        }
    }));

    return (
        <div className="w-full h-full flex items-center justify-center overflow-hidden" style={style}>
            <style dangerouslySetInnerHTML={{ __html: `
                .qr-styling-container-fisto canvas,
                .qr-styling-container-fisto svg {
                    width: 100% !important;
                    height: 100% !important;
                    max-width: 100% !important;
                    max-height: 100% !important;
                    display: block !important;
                }
            ` }} />
            <div 
                ref={containerRef} 
                className="qr-styling-container-fisto flex items-center justify-center w-full h-full"
            />
        </div>
    );
});

const Model3DEditor = ({
  onClose,
  shadowStrength, setShadowStrength,
  shadowSoftness, setShadowSoftness,
  autoRotate, setAutoRotate,
  autoRotateSpeed, setAutoRotateSpeed,
  lockMaxZoom, setLockMaxZoom,
  maxZoom, setMaxZoom,
  bgType, setBgType,
  bgColor, setBgColor,
  customBg, setCustomBg,
  enableAR, setEnableAR,
  qrText, setQrText, qrColor, setQrColor, qrBgType, setQrBgType, qrBgColor, setQrBgColor, qrLevel, setQrLevel, qrDotType, setQrDotType, qrCornerSquareType, setQrCornerSquareType, qrCornerDotType, setQrCornerDotType, qrLogo, setQrLogo,
  topText, setTopText, bottomText, setBottomText,
  dataUrl, vId,
  hotspots = [],
  activeHotspotId = null,
  onHotspotClick
}) => {
  const [localHotspots, setLocalHotspots] = useState(hotspots || []);

  useEffect(() => {
    if (Array.isArray(hotspots) && hotspots.length > 0) {
      setLocalHotspots(hotspots);
    }
  }, [hotspots]);

  useEffect(() => {
    if (typeof dataUrl === 'string' && dataUrl.startsWith('{')) {
      try {
        const parsed = JSON.parse(dataUrl);
        if (Array.isArray(parsed.hotspots) && parsed.hotspots.length > 0) {
          setLocalHotspots(parsed.hotspots);
        }
      } catch (e) {}
    }
  }, [dataUrl]);

  useEffect(() => {
    if (vId) {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      axios.get(`${backendUrl}/api/3d-models/get-model/${vId}`)
        .then(res => {
          if (res.data && Array.isArray(res.data.hotspots) && res.data.hotspots.length > 0) {
            setLocalHotspots(res.data.hotspots);
          }
        })
        .catch(err => console.error("Failed to load hotspots in Model3DEditor:", err));
    }
  }, [vId]);

  useEffect(() => {
    if (bgColor === '#000000') {
      setBgColor('#ffffff');
    }
  }, []); // Only run once on mount

  const qrThemes = [
    { name: 'Classic Black', fg: '#000000', bg: '#ffffff', dotType: 'square', cornerSquareType: 'square', cornerDotType: 'square' },
    { name: 'Ocean Blue', fg: '#4A3AFF', bg: '#ffffff', dotType: 'rounded', cornerSquareType: 'extra-rounded', cornerDotType: 'dot' },
    { name: 'Forest Green', fg: '#2E7D32', bg: '#ffffff', dotType: 'classy', cornerSquareType: 'square', cornerDotType: 'square' },
    { name: 'Red Accent', fg: '#D32F2F', bg: '#ffffff', dotType: 'rounded', cornerSquareType: 'extra-rounded', cornerDotType: 'dot' },
    { name: 'Dark Mode', fg: '#ffffff', bg: '#1a1a1a', dotType: 'square', cornerSquareType: 'square', cornerDotType: 'square' },
  ];

  const safeQrValue = React.useMemo(() => {
    if (!dataUrl && !vId) return qrText || "Scan Me";
    
    let resolvedVId = vId || null;
    if (!resolvedVId && typeof dataUrl === 'string' && dataUrl.startsWith('{')) {
      try {
        const parsed = JSON.parse(dataUrl);
        if (parsed.v_id) resolvedVId = parsed.v_id;
        if (parsed.vId) resolvedVId = parsed.vId;
      } catch (e) {}
    }

    if (resolvedVId) {
      return `${window.location.origin}/ar-view?id=${resolvedVId}`;
    }

    if (dataUrl && (dataUrl.startsWith('data:') || dataUrl.startsWith('blob:'))) {
      return "AR View unavailable for local/unsaved models.";
    }

    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    let resolvedUrl = dataUrl;
    if (typeof dataUrl === 'string' && dataUrl.startsWith('/')) {
      resolvedUrl = `${backendUrl}${dataUrl}`;
    } else {
      try {
        resolvedUrl = new URL(dataUrl, window.location.href).href;
      } catch (e) {
        resolvedUrl = dataUrl;
      }
    }
    return `${window.location.origin}/ar-view?url=${encodeURIComponent(resolvedUrl)}`;
  }, [dataUrl, qrText, vId]);

  const mainQrRef = useRef(null);
  const [activeThemeIdx, setActiveThemeIdx] = useState(0);

  const [showDotTypeDropdown, setShowDotTypeDropdown] = useState(false);
  const [showQrCornerSquareTypeDropdown, setShowQrCornerSquareTypeDropdown] = useState(false);
  const [showQrCornerDotTypeDropdown, setShowQrCornerDotTypeDropdown] = useState(false);
  const [showBgTypeDropdown, setShowBgTypeDropdown] = useState(false);
  const [showQrBgTypeDropdown, setShowQrBgTypeDropdown] = useState(false);
  const [showQrColorPicker, setShowQrColorPicker] = useState(false);
  const [showQrBgColorPicker, setShowQrBgColorPicker] = useState(false);
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);

  const [bgPickerPos, setBgPickerPos] = useState('down');
  const [qrColorPickerPos, setQrColorPickerPos] = useState('down');
  const [qrBgColorPickerPos, setQrBgColorPickerPos] = useState('down');

  const handleOpenPicker = (e, setPickerPos, setShowPicker, toggle = false, currentState = false) => {
      const rect = e.currentTarget.getBoundingClientRect();
      if (window.innerHeight - rect.bottom < 320 && rect.top > 320) {
          setPickerPos('up');
      } else {
          setPickerPos('down');
      }
      setShowPicker(toggle ? !currentState : true);
  };

  const applyTheme = (idx) => {
    setActiveThemeIdx(idx);
    const theme = qrThemes[idx];
    setQrColor(theme.fg);
    setQrBgColor(theme.bg);
    setQrBgType('Solid');
    setQrDotType(theme.dotType);
    setQrCornerSquareType(theme.cornerSquareType);
    setQrCornerDotType(theme.cornerDotType);
  };

  return (
    <div className="w-full font-sans text-gray-800 pb-[2vw] relative">
      
      {/* Action Buttons */}
      <div className="sticky top-0 z-10 bg-[#fbfbfb] pt-[1.5vw] pb-[1vw] px-[1.5vw] flex gap-[0.75vw] border-b border-gray-100 shadow-sm">
        <button 
          className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold h-[2.5vw] rounded-[0.5vw] flex items-center justify-center gap-[0.5vw] transition-colors shadow-sm"
          onClick={onClose}
        >
          <Icon icon="lucide:check" className="text-[1vw]" />
          <span className="text-[0.85vw]">Save Changes</span>
        </button>
        <button 
          className="flex-1 bg-white hover:bg-red-50 text-red-500 font-semibold h-[2.5vw] rounded-[0.5vw] border border-gray-300 flex items-center justify-center gap-[0.5vw] transition-colors shadow-sm"
          onClick={onClose}
        >
          <Icon icon="lucide:x" className="text-[1vw]" />
          <span className="text-[0.85vw]">Close</span>
        </button>
      </div>

      <div className="px-[1.5vw] space-y-[1.5vw] pt-[1vw]">
        {/* Text Customization */}
      <div className="space-y-[0.75vw] pt-[0.5vw]">
        <div className="flex items-center gap-[0.75vw]">
          <h2 className="text-[0.9vw] font-semibold text-gray-900 whitespace-nowrap tracking-wider">Text Overlays</h2>
          <div className="h-[0.0925vw] bg-gray-200 flex-1" style={{ marginRight: '-1.5vw' }}> </div>
        </div>
        
        <div className="flex flex-col gap-[1vw] bg-gray-50/80 rounded-[0.5vw] border border-gray-100 p-[1vw]">
            <div className="flex items-center gap-[1vw]">
              <span className="text-[0.85vw] font-medium text-gray-800 w-[6.5vw] whitespace-nowrap flex justify-between">Pop up Text<span>:</span></span>
              <div className="flex-1 h-[2vw] border border-gray-400 bg-white rounded-[0.5vw] flex items-center px-[0.75vw] gap-[0.5vw]">
                 <input 
                    type="text" 
                    value={topText} 
                    onChange={(e) => setTopText(e.target.value)} 
                    className="flex-1 bg-transparent border-none outline-none text-[0.8vw] text-gray-800"
                 />
                 <Icon icon="lucide:pencil" className="text-gray-400" />
              </div>
            </div>
            <div className="flex items-center gap-[1vw]">
              <span className="text-[0.85vw] font-medium text-gray-800 w-[6.5vw] whitespace-nowrap flex justify-between">Modal Name<span>:</span></span>
              <div className="flex-1 h-[2vw] border border-gray-400 bg-white rounded-[0.5vw] flex items-center px-[0.75vw] gap-[0.5vw]">
                 <input 
                    type="text" 
                    value={bottomText} 
                    onChange={(e) => setBottomText(e.target.value)} 
                    className="flex-1 bg-transparent border-none outline-none text-[0.8vw] text-gray-800"
                 />
                 <Icon icon="lucide:pencil" className="text-gray-400" />
              </div>
            </div>
        </div>
      </div>

      {/* 3D Hotspots Section */}
      <div className="space-y-[0.75vw]">
        <div className="flex items-center gap-[0.75vw]">
          <h2 className="text-[0.9vw] font-semibold text-gray-900 whitespace-nowrap tracking-wider">3D Hotspots</h2>
          {localHotspots && localHotspots.length > 0 && (
            <span className="bg-indigo-50 text-[#5145F6] border border-indigo-200 text-[0.7vw] font-bold px-[0.5vw] py-[0.1vw] rounded-full">
              {localHotspots.length}
            </span>
          )}
          <div className="h-[0.0925vw] bg-gray-200 flex-1" style={{ marginRight: '-1.5vw' }}> </div>
        </div>

        {(!localHotspots || localHotspots.length === 0) ? (
          <div className="p-[0.9vw] bg-gray-50/80 rounded-[0.5vw] border border-gray-100 text-center">
            <span className="text-[0.75vw] text-gray-400 font-medium">No hotspots configured for this model</span>
          </div>
        ) : (
          <div className="flex flex-col gap-[0.5vw] max-h-[16vw] overflow-y-auto no-scrollbar">
            {localHotspots.map((hs, i) => {
              const isSelected = activeHotspotId != null && (
                String(activeHotspotId) === String(hs.id) ||
                String(activeHotspotId) === String(hs.id || `hs_${i}`) ||
                activeHotspotId === i
              );
              return (
                <div
                  key={hs.id || i}
                  onClick={() => typeof onHotspotClick === 'function' && onHotspotClick(hs, i)}
                  className={`flex items-center justify-between p-[0.7vw] rounded-[0.5vw] border bg-white transition-all cursor-pointer shadow-sm ${
                    isSelected ? 'border-[#5145F6] ring-1 ring-[#5145F6]/40 bg-indigo-50/20' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  title="Click to view hotspot on 3D model"
                >
                  <div className="flex items-center gap-[0.6vw] min-w-0">
                    <div
                      className="w-[1.4vw] h-[1.4vw] rounded-full flex items-center justify-center text-white text-[0.7vw] font-bold shrink-0 shadow-sm"
                      style={{ backgroundColor: hs.color || '#5145F6' }}
                    >
                      {i + 1}
                    </div>
                    <span className="text-[0.8vw] font-semibold text-gray-800 truncate">
                      {hs.label || `Hotspot ${i + 1}`}
                    </span>
                  </div>
                  {hs.description && (
                    <span className="text-[0.7vw] text-gray-400 truncate max-w-[8vw] shrink-0 ml-[0.5vw]">
                      {hs.description}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Shadow Settings */}
      <div className="space-y-[0.75vw]">
        <div className="flex items-center gap-[0.75vw]">
          <h2 className="text-[0.9vw] font-semibold text-gray-900 whitespace-nowrap tracking-wider">Shadow Settings</h2>
          <div className="h-[0.0925vw] bg-gray-200 flex-1" style={{ marginRight: '-1.5vw' }}> </div>
        </div>
        
        <div className="flex flex-col gap-[1vw] bg-white border border-gray-200 rounded-[0.75vw] p-[1vw] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[0.8vw] font-semibold text-gray-800 w-[5vw]">Strength</span>
            <div className="flex items-center gap-[1vw] flex-1">
              <input 
                type="range" min="0" max="100" 
                value={shadowStrength} onChange={(e) => setShadowStrength(e.target.value)} 
                className="w-full h-[0.4vw] bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" 
              />
              <span className="text-[0.75vw] font-medium text-gray-700 w-[2.5vw] text-right">{shadowStrength}%</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[0.8vw] font-semibold text-gray-800 w-[5vw]">Softness</span>
            <div className="flex items-center gap-[1vw] flex-1">
              <input 
                type="range" min="0" max="100" 
                value={shadowSoftness} onChange={(e) => setShadowSoftness(e.target.value)} 
                className="w-full h-[0.4vw] bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" 
              />
              <span className="text-[0.75vw] font-medium text-gray-700 w-[2.5vw] text-right">{shadowSoftness}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3D Model Customization */}
      <div className="space-y-[1vw]">
        <div className="flex items-center gap-[0.75vw]">
          <h2 className="text-[0.9vw] font-semibold text-gray-900 whitespace-nowrap tracking-wider">3D Model Customization</h2>
          <div className="h-[0.0925vw] bg-gray-200 flex-1" style={{ marginRight: '-1.5vw' }}> </div>
        </div>

        {/* Auto Rotate Group */}
        <div className="border border-gray-200 rounded-[0.75vw] bg-white shadow-sm flex flex-col">
          <div className={`flex items-center justify-between p-[1vw] ${autoRotate ? 'border-b border-gray-200' : ''} transition-colors duration-300`}>
            <span className="text-[0.85vw] font-semibold text-gray-900">Auto Rotate</span>
            <div 
              className={`w-[2.4vw] h-[1.2vw] rounded-full p-[0.1vw] cursor-pointer transition-colors relative flex items-center ${autoRotate ? 'bg-[#5145F6]' : 'bg-gray-300'}`}
              onClick={() => setAutoRotate(!autoRotate)}
            >
              <div className={`w-[1vw] h-[1vw] bg-white rounded-full shadow-sm transform transition-transform flex items-center justify-center ${autoRotate ? 'translate-x-[1.2vw]' : 'translate-x-0'}`}>
                {autoRotate && <Icon icon="lucide:check" className="text-[#5145F6] text-[0.7vw]" />}
              </div>
            </div>
          </div>
          <AnimatePresence>
            {autoRotate && (
              <motion.div
                initial={{ height: 0, opacity: 0, overflow: 'hidden' }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0, overflow: 'hidden' }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                <div className="flex items-center justify-between p-[1vw]">
                  <span className="text-[0.85vw] font-medium text-gray-800">Auto Rotate Speed :</span>
                  <div className="flex items-center gap-[0.5vw]">
                    <Icon icon="lucide:chevron-left" className="text-gray-500 cursor-pointer hover:text-black w-[1vw] h-[1vw]" onClick={() => setAutoRotateSpeed(Math.max(0, autoRotateSpeed - 0.5))} />
                    <div className="border border-gray-400 rounded-[0.3vw] px-[0.5vw] py-[0.3vw] min-w-[3.5vw] flex items-center justify-center">
                      <span className="text-[0.8vw] font-medium text-gray-800">{autoRotateSpeed.toFixed(1)} x</span>
                    </div>
                    <Icon icon="lucide:chevron-right" className="text-gray-500 cursor-pointer hover:text-black w-[1vw] h-[1vw]" onClick={() => setAutoRotateSpeed(autoRotateSpeed + 0.5)} />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Zoom Group */}
        <div className="border border-gray-200 rounded-[0.75vw] bg-white shadow-sm flex flex-col mt-[1vw]">
          <div className={`flex items-center justify-between p-[1vw] ${lockMaxZoom ? 'border-b border-gray-200' : ''} transition-colors duration-300`}>
            <span className="text-[0.85vw] font-semibold text-gray-900">Lock Maximum Zoom</span>
            <div 
              className={`w-[2.4vw] h-[1.2vw] rounded-full p-[0.1vw] cursor-pointer transition-colors relative flex items-center ${lockMaxZoom ? 'bg-[#5145F6]' : 'bg-gray-300'}`}
              onClick={() => setLockMaxZoom(!lockMaxZoom)}
            >
              <div className={`w-[1vw] h-[1vw] bg-white rounded-full shadow-sm transform transition-transform flex items-center justify-center ${lockMaxZoom ? 'translate-x-[1.2vw]' : 'translate-x-0'}`}>
                {lockMaxZoom && <Icon icon="lucide:check" className="text-[#5145F6] text-[0.7vw]" />}
              </div>
            </div>
          </div>
          <AnimatePresence>
            {lockMaxZoom && (
              <motion.div
                initial={{ height: 0, opacity: 0, overflow: 'hidden' }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0, overflow: 'hidden' }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                <div className="flex items-center justify-between p-[1vw]">
                  <span className="text-[0.85vw] font-medium text-gray-800">Maximum Zoom % :</span>
                  <div className="flex items-center gap-[0.5vw]">
                    <Icon icon="lucide:chevron-left" className="text-gray-500 cursor-pointer hover:text-black w-[1vw] h-[1vw]" onClick={() => setMaxZoom(Math.max(1, maxZoom - 0.5))} />
                    <div className="border border-gray-400 rounded-[0.3vw] px-[0.5vw] py-[0.3vw] min-w-[3.5vw] flex items-center justify-center">
                      <span className="text-[0.8vw] font-medium text-gray-800">{maxZoom.toFixed(1)} x</span>
                    </div>
                    <Icon icon="lucide:chevron-right" className="text-gray-500 cursor-pointer hover:text-black w-[1vw] h-[1vw]" onClick={() => setMaxZoom(maxZoom + 0.5)} />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Background Color Group */}
        <div className="border border-gray-200 rounded-[0.75vw] bg-white shadow-sm flex flex-col mt-[1vw]">
          <div className="p-[1vw] border-b border-gray-200">
            <span className="text-[0.85vw] font-semibold text-gray-900">Background Color</span>
          </div>
          
            <div className="p-[1vw] flex flex-col border-b border-gray-200">
            <div className="flex items-center gap-[1vw]">
              <span className="text-[0.85vw] font-medium text-gray-800 w-[4vw] flex justify-between">Type <span>:</span></span>
              <div className="flex-1 relative">
                  <button 
                      onClick={() => setShowBgTypeDropdown(!showBgTypeDropdown)}
                      className="w-full bg-white border border-gray-300 rounded-[0.4vw] px-[0.6vw] py-[0.35vw] text-[0.75vw] font-semibold text-gray-700 outline-none flex items-center justify-between shadow-sm cursor-pointer hover:border-gray-400 transition-all"
                  >
                      <span>{bgType}</span>
                      <ChevronDown size="0.8vw" className={`text-gray-400 transition-transform duration-200 ${showBgTypeDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  {showBgTypeDropdown && (
                      <>
                          <div className="fixed inset-0 z-[55] cursor-default" onClick={() => setShowBgTypeDropdown(false)} />
                          <div className="absolute top-[calc(100%+0.2vw)] left-0 w-full bg-white border border-gray-100 rounded-[0.5vw] shadow-xl z-[60] py-[0.3vw]">
                              {['Solid', 'Transparent'].map((type) => (
                                  <button
                                      key={type}
                                      onClick={() => {
                                          setBgType(type);
                                          setShowBgTypeDropdown(false);
                                      }}
                                      className={`w-full text-left px-[0.6vw] py-[0.4vw] text-[0.7vw] font-semibold transition-all hover:bg-gray-50 flex items-center justify-between cursor-pointer ${bgType === type ? 'text-[#4A3AFF]' : 'text-gray-500 hover:text-gray-700'}`}
                                  >
                                      {type}
                                      {bgType === type && <Check size="0.7vw" />}
                                  </button>
                              ))}
                          </div>
                      </>
                  )}
              </div>
            </div>
            
            <AnimatePresence>
            {bgType === 'Solid' && (
            <motion.div 
                initial={{ height: 0, opacity: 0, marginTop: 0 }}
                animate={{ height: 'auto', opacity: 1, marginTop: '1vw' }}
                exit={{ height: 0, opacity: 0, marginTop: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-[1vw] relative"
            >
              <span className="text-[0.85vw] font-medium text-gray-800 w-[4vw] flex justify-between">BG Color <span>:</span></span>
              <div className="flex items-center gap-[0.5vw] flex-1">
                <button 
                    onClick={(e) => handleOpenPicker(e, setBgPickerPos, setShowBgColorPicker, true, showBgColorPicker)}
                    className="w-[2vw] h-[2vw] rounded-[0.5vw] border border-gray-400 overflow-hidden shrink-0 flex items-center justify-center relative cursor-pointer" 
                    style={{ backgroundColor: bgColor }}
                />
                {showBgColorPicker && (
                    <>
                        <div className="fixed inset-0 z-[55] cursor-default" onClick={() => setShowBgColorPicker(false)} />
                        <div className={`absolute left-[5vw] z-[60] ${bgPickerPos === 'up' ? 'bottom-[calc(100%+0.5vw)]' : 'top-[calc(100%+0.5vw)]'}`}>
                            <ColorPicker 
                                color={bgColor} 
                                onChange={(color) => setBgColor(color)} 
                                hidePalette={true}
                                onClose={() => setShowBgColorPicker(false)}
                            />
                        </div>
                    </>
                )}
                <div className="flex-1 border border-gray-400 rounded-[0.5vw] h-[2vw] bg-white flex items-center justify-between px-[0.75vw]">
                  <input 
                    type="text" 
                    value={bgColor} 
                    onChange={(e) => setBgColor(e.target.value)} 
                    onClick={(e) => handleOpenPicker(e, setBgPickerPos, setShowBgColorPicker)}
                    className="w-full text-[0.8vw] text-gray-600 font-medium uppercase outline-none bg-transparent cursor-pointer"
                  />
                  <span className="text-[0.8vw] text-gray-500">100%</span>
                </div>
              </div>
            </motion.div>
            )}
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-between p-[1vw]">
            <span className="text-[0.85vw] font-semibold text-gray-900">Custom Background</span>
            <div 
              className={`w-[2.4vw] h-[1.2vw] rounded-full p-[0.1vw] cursor-pointer transition-colors relative flex items-center ${customBg ? 'bg-[#5145F6]' : 'bg-gray-300'}`}
              onClick={() => setCustomBg(!customBg)}
            >
              <div className={`w-[1vw] h-[1vw] bg-white rounded-full shadow-sm transform transition-transform flex items-center justify-center ${customBg ? 'translate-x-[1.2vw]' : 'translate-x-0'}`}>
                {customBg && <Icon icon="lucide:check" className="text-[#5145F6] text-[0.7vw]" />}
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* AR View */}
      <div className="space-y-[0.75vw] pt-[0.5vw]">
        <div className="flex items-center gap-[0.75vw]">
          <h2 className="text-[0.9vw] font-semibold text-gray-900 whitespace-nowrap tracking-wider">AR View</h2>
          <div className="h-[0.0925vw] bg-gray-200 flex-1" style={{ marginRight: '-1.5vw' }}> </div>
        </div>
        
        <div className="flex flex-col gap-[0.5vw] px-[0.5vw]">
          <div className="flex items-center justify-between">
            <span className="text-[0.85vw] font-semibold text-gray-900">Enable AR (Augmented Reality)</span>
            <div className="flex-1 mx-[1vw] border-b border-dashed border-gray-300"></div>
            <div 
              className={`w-[2.4vw] h-[1.2vw] rounded-full p-[0.1vw] cursor-pointer transition-colors relative flex items-center ${enableAR ? 'bg-[#5145F6]' : 'bg-gray-300'}`}
              onClick={() => setEnableAR(!enableAR)}
            >
              <div className={`w-[1vw] h-[1vw] bg-white rounded-full shadow-sm transform transition-transform flex items-center justify-center ${enableAR ? 'translate-x-[1.2vw]' : 'translate-x-0'}`}>
                 {enableAR && <Icon icon="lucide:check" className="text-[#5145F6] text-[0.7vw]" />}
              </div>
            </div>
          </div>
          <span className="text-[0.75vw] text-gray-400 font-medium">Allow User To View This Model In AR</span>
        </div>
      </div>

      {/* QR Themes Placeholder */}
      <AnimatePresence>
        {enableAR && (
          <motion.div
            initial={{ height: 0, opacity: 0, overflow: 'hidden' }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0, overflow: 'hidden' }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <div className="pt-[0.5vw] pb-[0.5vw]">
              <div className="border border-gray-200 rounded-[0.75vw] bg-white shadow-sm flex flex-col p-[1.2vw] gap-[1vw]">
                <span className="text-[0.85vw] font-semibold text-gray-900">QR Themes</span>

                <div className="flex gap-[0.65vw]">
                  {qrThemes.map((theme, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => applyTheme(idx)}
                      className={`w-[3vw] h-[3vw] border rounded-[0.5vw] flex items-center justify-center bg-white cursor-pointer transition-colors ${activeThemeIdx === idx ? 'border-[#5145F6] bg-indigo-50' : 'border-gray-300 hover:border-[#5145F6]'}`}
                    >
                      <div className="w-[2vw] h-[2vw] pointer-events-none">
                        <CustomQRCode 
                          value="theme" 
                          size={1024} 
                          margin={0}
                          fgColor={theme.fg} 
                          bgColor={theme.bg} 
                          dotType={theme.dotType} 
                          cornerSquareType={theme.cornerSquareType} 
                          cornerDotType={theme.cornerDotType} 
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Real QR Preview & Download */}
                <div className="w-full flex flex-col items-center gap-[0.75vw] mb-[1vw]">
                  <div className="w-[12vw] h-[12vw] border border-gray-200 rounded-[1vw] overflow-hidden shadow-sm p-[1vw]" style={{ backgroundColor: qrBgType === 'Solid' ? qrBgColor : 'transparent' }}>
                    <CustomQRCode 
                      ref={mainQrRef}
                      value={enableAR ? safeQrValue : qrText} 
                      size={1024} 
                      margin={4}
                      fgColor={qrColor} 
                      bgColor={qrBgType === 'Solid' ? qrBgColor : 'transparent'} 
                      dotType={qrDotType} 
                      cornerSquareType={qrCornerSquareType} 
                      cornerDotType={qrCornerDotType} 
                      level={qrLevel || 'L'}
                      logo={qrLogo}
                    />
                  </div>
                  <div className="flex gap-[0.5vw] w-full max-w-[12vw]">
                    <button
                      type="button"
                      onClick={() => mainQrRef.current?.download({ name: 'ar-qr-code', extension: 'png' })}
                      className="flex-1 bg-[#5145F6] hover:bg-[#4335E6] text-white text-[0.75vw] font-semibold py-[0.45vw] px-[0.6vw] rounded-[0.4vw] flex items-center justify-center gap-[0.3vw] shadow-sm transition-all cursor-pointer"
                      title="Download QR Code as PNG image"
                    >
                      <Icon icon="lucide:download" className="w-[0.85vw] h-[0.85vw]" />
                      <span>PNG</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => mainQrRef.current?.download({ name: 'ar-qr-code', extension: 'svg' })}
                      className="flex-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 text-[0.75vw] font-semibold py-[0.45vw] px-[0.6vw] rounded-[0.4vw] flex items-center justify-center gap-[0.3vw] shadow-sm transition-all cursor-pointer"
                      title="Download QR Code as vector SVG"
                    >
                      <Icon icon="lucide:download" className="w-[0.85vw] h-[0.85vw]" />
                      <span>SVG</span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-[1vw]">
                  <div className="flex items-center gap-[1vw]">
                    <span className="text-[0.85vw] font-medium text-gray-900 w-[5.5vw] flex justify-between">QR Text <span>:</span></span>
                    <div className="flex-1 border border-gray-400 rounded-[0.5vw] bg-white h-[2vw] flex items-center px-[0.75vw] focus-within:border-[#5145F6] transition-colors">
                        <input type="text" placeholder="Scan Me" value={qrText} onChange={(e) => setQrText(e.target.value)} className="flex-1 outline-none text-[0.8vw] text-gray-500 bg-transparent font-medium" />
                        <Icon icon="lucide:pencil" className="text-gray-500 w-[1vw] h-[1vw]" />
                    </div>
                  </div>

                  <div className="flex items-center gap-[1vw] relative">
                    <span className="text-[0.85vw] font-medium text-gray-900 w-[5.5vw] flex justify-between">QR Color <span>:</span></span>
                    <div className="flex items-center gap-[0.5vw] flex-1">
                        <button 
                            onClick={(e) => {
                                handleOpenPicker(e, setQrColorPickerPos, setShowQrColorPicker, true, showQrColorPicker);
                                setShowQrBgColorPicker(false);
                            }}
                            className="w-[2vw] h-[2vw] rounded-[0.5vw] overflow-hidden shrink-0 border border-gray-300 relative cursor-pointer" 
                            style={{ backgroundColor: qrColor }}
                        />
                        {showQrColorPicker && (
                            <>
                                <div className="fixed inset-0 z-[55] cursor-default" onClick={() => setShowQrColorPicker(false)} />
                                <div className={`absolute left-[6vw] z-[60] ${qrColorPickerPos === 'up' ? 'bottom-[calc(100%+0.5vw)]' : 'top-[calc(100%+0.5vw)]'}`}>
                                    <ColorPicker 
                                        color={qrColor} 
                                        onChange={(color) => setQrColor(color)} 
                                        hidePalette={true}
                                        onClose={() => setShowQrColorPicker(false)}
                                    />
                                </div>
                            </>
                        )}
                        <div className="flex-1 border border-gray-400 rounded-[0.5vw] h-[2vw] bg-white flex items-center justify-between px-[0.75vw]">
                          <input 
                            type="text" 
                            value={qrColor} 
                            onChange={(e) => setQrColor(e.target.value)} 
                            onClick={(e) => {
                                handleOpenPicker(e, setQrColorPickerPos, setShowQrColorPicker);
                                setShowQrBgColorPicker(false);
                            }}
                            className="w-full text-[0.8vw] text-gray-600 font-medium uppercase outline-none bg-transparent cursor-pointer"
                          />
                          <span className="text-[0.8vw] text-gray-600 font-medium">100%</span>
                        </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-[1vw]">
                    <span className="text-[0.85vw] font-medium text-gray-900 w-[5.5vw] flex justify-between">Type <span>:</span></span>
                    <div className="flex-1 relative">
                        <button 
                            onClick={() => setShowQrBgTypeDropdown(!showQrBgTypeDropdown)}
                            className="w-full bg-white border border-gray-300 rounded-[0.4vw] px-[0.6vw] py-[0.35vw] text-[0.75vw] font-semibold text-gray-700 outline-none flex items-center justify-between shadow-sm cursor-pointer hover:border-gray-400 transition-all"
                        >
                            <span>{qrBgType}</span>
                            <ChevronDown size="0.8vw" className={`text-gray-400 transition-transform duration-200 ${showQrBgTypeDropdown ? 'rotate-180' : ''}`} />
                        </button>
                        {showQrBgTypeDropdown && (
                            <>
                                <div className="fixed inset-0 z-[55] cursor-default" onClick={() => setShowQrBgTypeDropdown(false)} />
                                <div className="absolute top-[calc(100%+0.2vw)] left-0 w-full bg-white border border-gray-100 rounded-[0.5vw] shadow-xl z-[60] py-[0.3vw]">
                                    {['Solid', 'Transparent'].map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => {
                                                setQrBgType(type);
                                                setShowQrBgTypeDropdown(false);
                                            }}
                                            className={`w-full text-left px-[0.6vw] py-[0.4vw] text-[0.7vw] font-semibold transition-all hover:bg-gray-50 flex items-center justify-between cursor-pointer ${qrBgType === type ? 'text-[#4A3AFF]' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            {type}
                                            {qrBgType === type && <Check size="0.7vw" />}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                  </div>

                  <AnimatePresence>
                  {qrBgType === 'Solid' && (
                  <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center gap-[1vw] relative overflow-visible"
                  >
                    <span className="text-[0.85vw] font-medium text-gray-900 w-[5.5vw] flex justify-between">BG Color <span>:</span></span>
                    <div className="flex items-center gap-[0.5vw] flex-1">
                        <button 
                            onClick={(e) => {
                                handleOpenPicker(e, setQrBgColorPickerPos, setShowQrBgColorPicker, true, showQrBgColorPicker);
                                setShowQrColorPicker(false);
                            }}
                            className="w-[2vw] h-[2vw] rounded-[0.5vw] overflow-hidden shrink-0 border border-gray-300 relative cursor-pointer" 
                            style={{ backgroundColor: qrBgColor === 'transparent' ? '#ffffff' : qrBgColor }}
                        />
                        {showQrBgColorPicker && (
                            <>
                                <div className="fixed inset-0 z-[55] cursor-default" onClick={() => setShowQrBgColorPicker(false)} />
                                <div className={`absolute left-[6vw] z-[60] ${qrBgColorPickerPos === 'up' ? 'bottom-[calc(100%+0.5vw)]' : 'top-[calc(100%+0.5vw)]'}`}>
                                    <ColorPicker 
                                        color={qrBgColor} 
                                        onChange={(color) => setQrBgColor(color)} 
                                        hidePalette={true}
                                        onClose={() => setShowQrBgColorPicker(false)}
                                    />
                                </div>
                            </>
                        )}
                        <div className="flex-1 border border-gray-400 rounded-[0.5vw] h-[2vw] bg-white flex items-center justify-between px-[0.75vw]">
                          <input 
                            type="text" 
                            value={qrBgColor} 
                            onChange={(e) => setQrBgColor(e.target.value)} 
                            onClick={(e) => {
                                handleOpenPicker(e, setQrBgColorPickerPos, setShowQrBgColorPicker);
                                setShowQrColorPicker(false);
                            }}
                            className="w-full text-[0.8vw] text-gray-600 font-medium uppercase outline-none bg-transparent cursor-pointer"
                          />
                          <span className="text-[0.8vw] text-gray-600 font-medium">100%</span>
                        </div>
                    </div>
                  </motion.div>
                  )}
                  </AnimatePresence>

                  <div className="flex items-center gap-[1vw]">
                    <span className="text-[0.85vw] font-medium text-gray-900 w-[5.5vw] flex justify-between">QR Level <span>:</span></span>
                    <div className="flex-1 flex items-center bg-white border border-gray-200 rounded-[0.6vw] p-[0.3vw] gap-[0.3vw] shadow-sm">
                        {[
                            { label: 'Low', value: 'L' },
                            { label: 'Medium', value: 'M' },
                            { label: 'High', value: 'H' }
                        ].map((level) => (
                            <button
                                key={level.value}
                                onClick={() => setQrLevel(level.value)}
                                className={`flex-1 px-[0.5vw] py-[0.3vw] rounded-[0.4vw] text-[0.75vw] cursor-pointer font-semibold transition-all ${qrLevel === level.value ? 'bg-black text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                {level.label}
                            </button>
                        ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-[1vw]">
                    <span className="text-[0.85vw] font-medium text-gray-900 w-[5.5vw] flex justify-between">Dot Style <span>:</span></span>
                    <div className="flex-1 relative">
                        <button 
                            onClick={() => setShowDotTypeDropdown(!showDotTypeDropdown)}
                            className="w-full bg-white border border-gray-300 rounded-[0.4vw] px-[0.6vw] py-[0.35vw] text-[0.75vw] font-semibold text-gray-700 outline-none flex items-center justify-between shadow-sm cursor-pointer hover:border-gray-400 transition-all"
                        >
                            <span className="capitalize">{qrDotType.replace('-', ' ')}</span>
                            <ChevronDown size="0.8vw" className={`text-gray-400 transition-transform duration-200 ${showDotTypeDropdown ? 'rotate-180' : ''}`} />
                        </button>
                        {showDotTypeDropdown && (
                            <>
                                <div className="fixed inset-0 z-[55] cursor-default" onClick={() => setShowDotTypeDropdown(false)} />
                                <div className="absolute top-[calc(100%+0.2vw)] left-0 w-full bg-white border border-gray-100 rounded-[0.5vw] shadow-xl z-[60] py-[0.3vw] max-h-[12vw] overflow-y-auto custom-scrollbar">
                                    {['square', 'dots', 'rounded', 'extra-rounded', 'classy', 'classy-rounded'].map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => {
                                                setQrDotType(type);
                                                setShowDotTypeDropdown(false);
                                            }}
                                            className={`w-full text-left px-[0.6vw] py-[0.4vw] text-[0.7vw] font-semibold capitalize transition-all hover:bg-gray-50 flex items-center justify-between cursor-pointer ${qrDotType === type ? 'text-[#4A3AFF]' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            {type.replace('-', ' ')}
                                            {qrDotType === type && <Check size="0.7vw" />}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                  </div>

                  <div className="flex items-center gap-[1vw]">
                    <span className="text-[0.85vw] font-medium text-gray-900 w-[5.5vw] flex justify-between">Eye Frame <span>:</span></span>
                    <div className="flex-1 relative">
                        <button 
                            onClick={() => setShowQrCornerSquareTypeDropdown(!showQrCornerSquareTypeDropdown)}
                            className="w-full bg-white border border-gray-300 rounded-[0.4vw] px-[0.6vw] py-[0.35vw] text-[0.75vw] font-semibold text-gray-700 outline-none flex items-center justify-between shadow-sm cursor-pointer hover:border-gray-400 transition-all"
                        >
                            <span className="capitalize">{qrCornerSquareType.replace('-', ' ')}</span>
                            <ChevronDown size="0.8vw" className={`text-gray-400 transition-transform duration-200 ${showQrCornerSquareTypeDropdown ? 'rotate-180' : ''}`} />
                        </button>
                        {showQrCornerSquareTypeDropdown && (
                            <>
                                <div className="fixed inset-0 z-[55] cursor-default" onClick={() => setShowQrCornerSquareTypeDropdown(false)} />
                                <div className="absolute top-[calc(100%+0.2vw)] left-0 w-full bg-white border border-gray-100 rounded-[0.5vw] shadow-xl z-[60] py-[0.3vw]">
                                    {['square', 'dot', 'extra-rounded'].map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => {
                                                setQrCornerSquareType(type);
                                                setShowQrCornerSquareTypeDropdown(false);
                                            }}
                                            className={`w-full text-left px-[0.6vw] py-[0.4vw] text-[0.7vw] font-semibold capitalize transition-all hover:bg-gray-50 flex items-center justify-between cursor-pointer ${qrCornerSquareType === type ? 'text-[#4A3AFF]' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            {type.replace('-', ' ')}
                                            {qrCornerSquareType === type && <Check size="0.7vw" />}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                  </div>

                  <div className="flex items-center gap-[1vw]">
                    <span className="text-[0.85vw] font-medium text-gray-900 w-[5.5vw] flex justify-between">Eye Ball <span>:</span></span>
                    <div className="flex-1 relative">
                        <button 
                            onClick={() => setShowQrCornerDotTypeDropdown(!showQrCornerDotTypeDropdown)}
                            className="w-full bg-white border border-gray-300 rounded-[0.4vw] px-[0.6vw] py-[0.35vw] text-[0.75vw] font-semibold text-gray-700 outline-none flex items-center justify-between shadow-sm cursor-pointer hover:border-gray-400 transition-all"
                        >
                            <span className="capitalize">{qrCornerDotType.replace('-', ' ')}</span>
                            <ChevronDown size="0.8vw" className={`text-gray-400 transition-transform duration-200 ${showQrCornerDotTypeDropdown ? 'rotate-180' : ''}`} />
                        </button>
                        {showQrCornerDotTypeDropdown && (
                            <>
                                <div className="fixed inset-0 z-[55] cursor-default" onClick={() => setShowQrCornerDotTypeDropdown(false)} />
                                <div className="absolute top-[calc(100%+0.2vw)] left-0 w-full bg-white border border-gray-100 rounded-[0.5vw] shadow-xl z-[60] py-[0.3vw]">
                                    {['square', 'dot'].map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => {
                                                setQrCornerDotType(type);
                                                setShowQrCornerDotTypeDropdown(false);
                                            }}
                                            className={`w-full text-left px-[0.6vw] py-[0.4vw] text-[0.7vw] font-semibold capitalize transition-all hover:bg-gray-50 flex items-center justify-between cursor-pointer ${qrCornerDotType === type ? 'text-[#4A3AFF]' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            {type.replace('-', ' ')}
                                            {qrCornerDotType === type && <Check size="0.7vw" />}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                  </div>

                  <div className="flex items-start gap-[1vw]">
                    <span className="text-[0.85vw] font-medium text-gray-900 w-[5.5vw] shrink-0 flex justify-between mt-[0.4vw]">Add Logo <span>:</span></span>
                    <div className="flex-1 flex flex-col items-center gap-[0.4vw]">
                        <label className="w-full h-[3.5vw] border-[0.12vw] border-dashed border-gray-300 rounded-[0.6vw] flex flex-col items-center justify-center gap-[0.2vw] bg-gray-50/50 hover:bg-gray-50 transition-colors cursor-pointer group relative overflow-hidden">
                            <input 
                                type="file" 
                                className="hidden" 
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                            setQrLogo(reader.result);
                                        };
                                        reader.readAsDataURL(file);
                                    }
                                }}
                            />
                            {qrLogo ? (
                                <div className="absolute inset-0 flex items-center justify-center bg-white p-[0.3vw]">
                                    <img 
                                        src={qrLogo} 
                                        alt="QR Logo" 
                                        className="h-full object-contain"
                                    />
                                    <div 
                                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setQrLogo(null);
                                        }}
                                    >
                                        <Icon icon="lucide:trash-2" className="text-white w-[1.2vw] h-[1.2vw]" />
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <Icon icon="lucide:upload-cloud" className="w-[1.2vw] h-[1.2vw] text-gray-400 group-hover:text-[#4A3AFF] transition-colors" />
                                    <span className="text-[0.65vw] font-semibold text-gray-500 group-hover:text-gray-700 transition-colors uppercase tracking-wider">Upload Logo</span>
                                </>
                            )}
                        </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
};

export default Model3DEditor;
