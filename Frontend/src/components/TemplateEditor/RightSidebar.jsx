import React, { useState, useRef, useEffect } from 'react';
import { getVisualBBox, getCanvasBounds } from './MainEditor';
import { SquarePlay, Image as ImageIcon, CloudUpload, Minus, Plus, ChevronLeft, ChevronRight, Upload, Link, Check, FileText, Video } from 'lucide-react';
import { Icon } from '@iconify/react';
import { checkIsAnimatedWebp } from './editorUtils';
import ShapeProperties from './ShapeProperties';
import PenToolProperties from './PenToolProperties';
import ImageEditor from './ImageEditor';
import TextEditor from './TextEditor';
import IconGallery from './icons';
import VideoEditor from './VideoEditor';
import GifEditor from './Gif';
import AnimationPanel from './AnimationPanel';
import InteractionPanel from './InteractionPanel';
import Elements from './Elements/Elements';
import PopupTemplateSelection from './PopupTemplateSelection';
import Model3DEditor from './Model3DEditor';
import GroupProperties from './GroupProperties';
import ThirdPartyEmbedProperties from './Elements/3rdPartyEmbedProperties';
import QRCodeProperties from './Elements/QRCodeProperties';
import AudioProperties from './Elements/AudioProperties';
import ImportViaUrlModal from './ImportViaUrlModal';
import ButtonEditor from './Elements/ButtonEditor';
import MapEditor from './Elements/MapEditor';
import ImageFramingProperties from './Elements/ImageFramingProperties';
import ColorPicker, { parseGradient } from './ColorPicker';
import MediaGalleryPopup from './MediaGalleryPopup';
import { generateGradientString } from "../CustomizedEditor/AppearanceShared";
import { createPortal } from 'react-dom';
import { useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../CustomToast';
const DimensionInput = ({ targetId, targetAttr, value, readOnly, onChange, className }) => {
  const [localVal, setLocalVal] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [liveVal, setLiveVal] = useState(null);

  useEffect(() => {
    if (!targetId || readOnly) {
      setLiveVal(null);
      return;
    }

    let frameId;
    const poll = () => {
      const editorDoc = document.getElementById('main-flipbook-editor')?.contentDocument || document;
      const el = editorDoc.getElementById(targetId);
      if (el && typeof el.getBBox === 'function') {
        try {
          let bbox;
          if (el.getAttribute('data-is-hotspot') === 'true') {
            bbox = { x: 0, y: 0, width: 52, height: 52 };
          } else {
            bbox = getVisualBBox(el);
          }
          let rawVal = 0;
          let m = [1, 0, 0, 1, 0, 0];
          const transform = el.getAttribute('transform');
          if (transform) {
            try {
              const domM = new DOMMatrix(transform);
              m = [domM.a, domM.b, domM.c, domM.d, domM.e, domM.f];
            } catch (_) {
              if (transform.includes('matrix')) {
                const match = transform.match(/matrix\(([^)]+)\)/);
                if (match) {
                  const parsedM = match[1].split(/[\s,]+/).map(parseFloat);
                  if (parsedM.length === 6) m = parsedM;
                }
              }
            }
          }

          if (targetAttr === 'width') rawVal = bbox.width * Math.abs(m[0]);
          else if (targetAttr === 'height') rawVal = bbox.height * Math.abs(m[3]);
          else if (targetAttr === 'x') rawVal = bbox.x * m[0] + (m[0] < 0 ? bbox.width * m[0] : 0) + m[4];
          else if (targetAttr === 'y') rawVal = bbox.y * m[3] + (m[3] < 0 ? bbox.height * m[3] : 0) + m[5];

          if (el.tagName === 'circle' && (!transform || !transform.includes('matrix'))) {
            const r = parseFloat(el.getAttribute('r')) || 0;
            if (targetAttr === 'width' || targetAttr === 'height') rawVal = r * 2;
            else if (targetAttr === 'x') rawVal = (parseFloat(el.getAttribute('cx')) || 0) - r;
            else if (targetAttr === 'y') rawVal = (parseFloat(el.getAttribute('cy')) || 0) - r;
          }

          const finalLiveVal = Number(rawVal.toFixed(1)).toString();

          setLiveVal((prev) => (prev !== finalLiveVal ? finalLiveVal : prev));
        } catch (e) { }
      } else {
        setLiveVal(null);
      }
      frameId = requestAnimationFrame(poll);
    };
    poll();
    return () => cancelAnimationFrame(frameId);
  }, [targetId, targetAttr, readOnly]);

  const displayValue = isEditing ? localVal : (liveVal !== null ? liveVal : value);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur();
      return;
    }
    const allowedControlKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
    if (allowedControlKeys.includes(e.key) || e.ctrlKey || e.metaKey) {
      return;
    }
    if (e.key === '-' && (targetAttr === 'x' || targetAttr === 'y')) {
      if (e.target.value.includes('-')) e.preventDefault();
      return;
    }
    if (e.key === '.') {
      if (e.target.value.includes('.')) e.preventDefault();
      return;
    }
    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handleChange = (e) => {
    let val = e.target.value;
    if (targetAttr === 'x' || targetAttr === 'y') {
      val = val.replace(/[^0-9.-]/g, '');
    } else {
      val = val.replace(/[^0-9.]/g, '');
    }
    setLocalVal(val);
  };

  return (
    <input
      className={className}
      value={displayValue}
      readOnly={readOnly}
      disabled={readOnly}
      tabIndex={readOnly ? -1 : 0}
      onFocus={() => {
        if (readOnly) return;
        setIsEditing(true);
        setLocalVal(displayValue);
      }}
      onBlur={() => {
        if (readOnly) return;
        setIsEditing(false);
        if (localVal !== '' && localVal !== (liveVal !== null ? liveVal : value).toString()) {
          onChange(localVal);
        }
      }}
      onChange={(e) => {
        if (readOnly) return;
        handleChange(e);
      }}
      onKeyDown={(e) => {
        if (readOnly) return;
        handleKeyDown(e);
      }}
    />
  );
};

const RightSidebar = ({
  isDoublePage,
  setIsDoublePage,
  isRulerEnabled,
  setIsRulerEnabled,
  activeMainTool,
  setActiveMainTool,
  activeTopTool,
  activePageIndex,
  pages,
  setPages,
  updatePageBackground,
  selectedLayerId,
  setSelectedLayerId,
  multiSelectedIds = null,
  setMultiSelectedIds,
  updateElementAttribute,
  deleteLayer,
  onPreview,
  activePreviewDevice: activePreviewDeviceProp,
  setActivePreviewDevice: setActivePreviewDeviceProp,
  flipbookDimensions = { width: 210, height: 297 },
  isPopupEditor = false,
  onCustomizePopup,
  onApplyPopupChanges,
  onCancelPopupChanges,
  is3DModalOpen,
  setIs3DModalOpen,
  preview3DDataUrl,
  setCurrent3DItem,
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
  current3DVId,
  hotspots = [],
  activeHotspotId = null,
  onHotspotClick,
  v_id: v_idProp,
  flipbookVId: flipbookVIdProp,
  folderName: folderNameProp,
  flipbookName: flipbookNameProp,
  folder: folderProp
}) => {
  const { folder: paramFolder, v_id: paramVId } = useParams();
  const location = useLocation();

  const effectiveVId = v_idProp || flipbookVIdProp || paramVId || location.state?.v_id || location.state?.flipbook_v_id;
  const effectiveFolder = folderNameProp || folderProp || paramFolder || location.state?.folderName || 'My_Flipbooks';
  const effectiveBook = flipbookNameProp || location.state?.flipbookName || 'Untitled Flipbook';

  const isPdfProject = pages.some(p => p.html && (
    p.html.includes('data-name="PDF Background"') ||
    p.html.includes('PDF Background') ||
    p.html.includes('pdf-vector-layer') ||
    p.html.includes('Document Shield')
  ));
  const { width: baseWidth, height: baseHeight } = flipbookDimensions;

  const [isNodeEditActive, setIsNodeEditActive] = useState(false);

  useEffect(() => {
    const handleNodeEditChange = (e) => {
      setIsNodeEditActive(Boolean(e.detail?.active));
    };
    window.addEventListener('node-edit-mode-changed', handleNodeEditChange);
    return () => window.removeEventListener('node-edit-mode-changed', handleNodeEditChange);
  }, []);



  // Convert mm to pixels at 96 DPI for the input display if no element selected
  const baseWidthPx = Math.round(baseWidth * 96 / 25.4);
  const baseHeightPx = Math.round(baseHeight * 96 / 25.4);

  const getDocumentInfo = (w, h) => {
    const roundedW = Math.round(w || 210);
    const roundedH = Math.round(h || 297);
    const minDim = Math.min(roundedW, roundedH);
    const maxDim = Math.max(roundedW, roundedH);

    let formatName = 'Custom Sheet';
    if (Math.abs(minDim - 210) <= 3 && Math.abs(maxDim - 297) <= 3) {
      formatName = 'A4';
    } else if (Math.abs(minDim - 297) <= 3 && Math.abs(maxDim - 420) <= 3) {
      formatName = 'A3';
    } else if (Math.abs(minDim - 148) <= 3 && Math.abs(maxDim - 210) <= 3) {
      formatName = 'A5';
    } else if (Math.abs(minDim - 216) <= 3 && Math.abs(maxDim - 279) <= 3) {
      formatName = 'Letter';
    } else if (Math.abs(minDim - 216) <= 3 && Math.abs(maxDim - 356) <= 3) {
      formatName = 'Legal';
    } else if (Math.abs(minDim - 99) <= 3 && Math.abs(maxDim - 210) <= 3) {
      formatName = 'DL';
    } else if (Math.abs(roundedW - roundedH) <= 3) {
      formatName = 'Square';
    }

    let orientationName = 'Portrait';
    if (roundedW > roundedH) {
      orientationName = 'Landscape';
    } else if (roundedW === roundedH) {
      orientationName = 'Square';
    }

    return {
      format: formatName,
      orientation: orientationName,
      dimensions: `${roundedW} x ${roundedH} mm`
    };
  };
  const fileInputRef = useRef(null);
  const toast = useToast();
  const [activePreviewDevice, setActivePreviewDevice] = useState(localStorage.getItem('previewDevice') || 'Desktop');
  const [dimensionUnit, setDimensionUnit] = useState('mm');
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [isMediaGalleryOpen, setIsMediaGalleryOpen] = useState(false);
  const browseGalleryBtnRef = useRef(null);
  const [isUnitDropdownOpen, setIsUnitDropdownOpen] = useState(false);
  const [isPageBgPickerOpen, setIsPageBgPickerOpen] = useState(false);
  const unitRef = useRef(null);
  const [expandedInteraction, setExpandedInteraction] = useState('call-click');
  const [interactionTab, setInteractionTab] = useState('Call');
  const [isInteractionMenuOpen, setIsInteractionMenuOpen] = useState(false);
  const interactionMenuRef = useRef(null);

  const updatePosition = (val, targetAttr) => {
    if (activeTopTool === 'interaction' || activeTopTool === 'animation') return;
    if (!selectedElementProps) return;
    const editorDoc = document.getElementById('main-flipbook-editor')?.contentDocument || document;
    const el = editorDoc.getElementById(selectedLayerId);
    if (!el) return;

    let newVal = parseFloat(val);

    const transform = el.getAttribute('transform');
    if (transform && transform.includes('matrix')) {
      const match = transform.match(/matrix\(([^)]+)\)/);
      if (match) {
        const m = match[1].split(/[\s,]+/).map(parseFloat);
        if (m.length === 6) {
          const bbox = getVisualBBox(el);
          const bounds = getCanvasBounds(el, flipbookDimensions?.width, flipbookDimensions?.height);
          const visW = bbox.width * Math.abs(m[0]);
          const visH = bbox.height * Math.abs(m[3]);

          if (targetAttr === 'x') {
            newVal = Math.max(bounds.minX, Math.min(bounds.maxX - visW, newVal));
            const offsetX = bbox.x * m[0] + (m[0] < 0 ? bbox.width * m[0] : 0);
            m[4] = newVal - offsetX;
            updateElementAttribute(activePageIndex, selectedLayerId, {
              'transform': `matrix(${m.join(', ')})`,
              'data-x': m[4].toString()
            });
          } else {
            newVal = Math.max(bounds.minY, Math.min(bounds.maxY - visH, newVal));
            const offsetY = bbox.y * m[3] + (m[3] < 0 ? bbox.height * m[3] : 0);
            m[5] = newVal - offsetY;
            updateElementAttribute(activePageIndex, selectedLayerId, {
              'transform': `matrix(${m.join(', ')})`,
              'data-y': m[5].toString()
            });
          }
          setTimeout(() => {
            if (typeof window.drawOverlayHighlight === 'function') {
              window.drawOverlayHighlight(el, 'selected');
            }
          }, 50);
          return;
        }
      }
    }

    if (targetAttr === 'x') {
      if (selectedElementProps.tagName === 'circle' || selectedElementProps.tagName === 'ellipse') {
        const radius = parseFloat(selectedElementProps.tagName === 'circle' ? el.getAttribute('r') : el.getAttribute('rx')) || 0;
        updateElementAttribute(activePageIndex, selectedLayerId, 'cx', (newVal + radius).toString());
      } else {
        updateElementAttribute(activePageIndex, selectedLayerId, 'x', newVal.toString());
      }
    } else {
      if (selectedElementProps.tagName === 'circle' || selectedElementProps.tagName === 'ellipse') {
        const radius = parseFloat(selectedElementProps.tagName === 'circle' ? el.getAttribute('r') : el.getAttribute('ry')) || 0;
        updateElementAttribute(activePageIndex, selectedLayerId, 'cy', (newVal + radius).toString());
      } else {
        updateElementAttribute(activePageIndex, selectedLayerId, 'y', newVal.toString());
      }
    }
  };

  const convertValue = (mmValue) => {
    const val = parseFloat(mmValue || 0);
    if (dimensionUnit === 'px') return Math.round(val * 96 / 25.4);
    if (dimensionUnit === 'cm') return (val / 10).toFixed(2);
    return Number(val.toFixed(1)); // mm
  };

  const updateDimensionWithScale = (val, targetAttr) => {
    if (activeTopTool === 'interaction' || activeTopTool === 'animation') return;
    if (!selectedElementProps) return;
    let scale = 1;
    let m = [1, 0, 0, 1, 0, 0];
    let hasMatrix = false;
    const editorDoc = document.getElementById('main-flipbook-editor')?.contentDocument || document;
    const el = editorDoc.getElementById(selectedLayerId);
    if (el) {
      const transform = el.getAttribute('transform');
      if (transform && transform.includes('matrix')) {
        const match = transform.match(/matrix\(([^)]+)\)/);
        if (match) {
          const parsedM = match[1].split(/[\s,]+/).map(parseFloat);
          if (parsedM.length === 6) {
            m = parsedM;
            hasMatrix = true;
            scale = Math.abs(targetAttr === 'width' ? m[0] : m[3]);
          }
        }
      }
    }
    const tag = selectedElementProps.tagName;

    if (tag === 'line') {
      if (!el) return;
      const x1 = parseFloat(el.getAttribute('x1')) || 0;
      const y1 = parseFloat(el.getAttribute('y1')) || 0;
      const x2 = parseFloat(el.getAttribute('x2')) || 0;
      const y2 = parseFloat(el.getAttribute('y2')) || 0;

      const unscaledVal = parseFloat(val) / scale;

      if (targetAttr === 'width') {
        // Preserve direction if line was drawn right-to-left
        const direction = x2 >= x1 ? 1 : -1;
        updateElementAttribute(activePageIndex, selectedLayerId, 'x2', (x1 + direction * unscaledVal).toString());
      } else if (targetAttr === 'height') {
        // Preserve direction if line was drawn bottom-to-top
        const direction = y2 >= y1 ? 1 : -1;
        updateElementAttribute(activePageIndex, selectedLayerId, 'y2', (y1 + direction * unscaledVal).toString());
      }
      return;
    }

    if (tag === 'ellipse' || tag === 'circle') {
      const unscaledVal = parseFloat(val) / scale;
      if (targetAttr === 'width') {
        updateElementAttribute(activePageIndex, selectedLayerId, 'rx', (unscaledVal / 2).toString());
        // also try 'r' just in case it's a true circle without rx
        if (tag === 'circle' && el && el.hasAttribute('r')) updateElementAttribute(activePageIndex, selectedLayerId, 'r', (unscaledVal / 2).toString());
      } else if (targetAttr === 'height') {
        updateElementAttribute(activePageIndex, selectedLayerId, 'ry', (unscaledVal / 2).toString());
      }
      return;
    }

    if (tag === 'path' || tag === 'polygon' || tag === 'g' || tag === 'rect' || tag === 'image' || tag === 'foreignobject' || hasMatrix) {
      if (!el) return;
      const bbox = getVisualBBox(el);
      const targetVal = parseFloat(val);
      if (targetVal <= 0 || bbox.width === 0 || bbox.height === 0) return;

      if (targetAttr === 'width') {
        // Current world X of top-left (account for negative scale when flipped)
        const oldWorldX = bbox.x * m[0] + (m[0] < 0 ? bbox.width * m[0] : 0) + m[4];
        // New m[0] scale (preserve sign for flip)
        const newM0 = (m[0] >= 0 ? 1 : -1) * (targetVal / bbox.width);
        // New m[4] translation to keep top-left fixed
        const newM4 = oldWorldX - (bbox.x * newM0 + (newM0 < 0 ? bbox.width * newM0 : 0));
        m[0] = newM0;
        m[4] = newM4;
      } else if (targetAttr === 'height') {
        // Current world Y of top-left (account for negative scale when flipped)
        const oldWorldY = bbox.y * m[3] + (m[3] < 0 ? bbox.height * m[3] : 0) + m[5];
        // New m[3] scale (preserve sign for flip)
        const newM3 = (m[3] >= 0 ? 1 : -1) * (targetVal / bbox.height);
        // New m[5] translation to keep top-left fixed
        const newM5 = oldWorldY - (bbox.y * newM3 + (newM3 < 0 ? bbox.height * newM3 : 0));
        m[3] = newM3;
        m[5] = newM5;
      }

      updateElementAttribute(activePageIndex, selectedLayerId, 'transform', `matrix(${m.join(', ')})`);

      // Trigger overlay highlight update
      setTimeout(() => {
        if (typeof window.drawOverlayHighlight === 'function') {
          window.drawOverlayHighlight(el, 'selected');
        }
      }, 50);
      return;
    }

    const elementAttr = targetAttr;

    // Note: for a circle, 'val' is the diameter. We want the unscaled radius.
    // For other elements, 'val' is the width/height. We want the unscaled width/height.
    const finalVal = tag === 'circle'
      ? (parseFloat(val) / 2 / scale).toString()
      : (parseFloat(val) / scale).toString();

    updateElementAttribute(activePageIndex, selectedLayerId, elementAttr, finalVal);
  };

  // Close unit dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (unitRef.current && !unitRef.current.contains(e.target)) {
        setIsUnitDropdownOpen(false);
      }
      if (interactionMenuRef.current && !interactionMenuRef.current.contains(e.target)) {
        setIsInteractionMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync with prop if provided, otherwise use local/localStorage
  useEffect(() => {
    if (activePreviewDeviceProp) setActivePreviewDevice(activePreviewDeviceProp);
  }, [activePreviewDeviceProp]);

  const handleDeviceChange = (device) => {
    setActivePreviewDevice(device);
    localStorage.setItem('previewDevice', device);
    window.dispatchEvent(new CustomEvent('previewDeviceChange', { detail: device }));
    setActivePreviewDeviceProp?.(device);
  };

  useEffect(() => {
    const handleGlobalDeviceChange = (e) => {
      setActivePreviewDevice(e.detail);
    };
    window.addEventListener('previewDeviceChange', handleGlobalDeviceChange);
    return () => window.removeEventListener('previewDeviceChange', handleGlobalDeviceChange);
  }, []);

  const presetColors = [
    '#ffffff', '#f3f4f6', '#e5e7eb', '#d1d5db', '#9ca3af', '#4b5563', '#1f2937', '#000000',
    '#eff6ff', '#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8',
    '#ecfdf5', '#d1fae5', '#a7f3d0', '#6ee7b7', '#34d399', '#10b981', '#059669', '#047857',
    '#fff7ed', '#ffedd5', '#fed7aa', '#fdba74', '#fb923c', '#f97316', '#ea580c', '#c2410c',
    '#fef2f2', '#fee2e2', '#fecaca', '#fca5a5', '#f87171', '#ef4444', '#dc2626', '#b91c1c'
  ];

  const [showUrlImport, setShowUrlImport] = useState(false);
  const [urlInputText, setUrlInputText] = useState('');

  const handleUrlImportSubmit = () => {
    if (!urlInputText.trim()) return;
    alert("Importing media from URL: " + urlInputText);
    setUrlInputText('');
    setShowUrlImport(false);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Switch to cursor tool instantly
    if (setActiveMainTool) {
      setActiveMainTool('select');
    }

    // Optional: Limit raw file size to 15MB
    if (file.size > 20 * 1024 * 1024) {
      alert("File is too large! Please upload images smaller than 20MB.");
      e.target.value = '';
      return;
    }

    const isVideo = file.type.startsWith('video/');
    let isGif = file.type === 'image/gif';
    if (!isGif && file.type.includes('webp')) {
      isGif = await checkIsAnimatedWebp(file);
    }
    const isSvg = file.type === 'image/svg+xml';

    if (!file.type.startsWith('image/') && !isVideo && !isGif && !isSvg) {
      toast.error('Only Image, Video, and GIF formats are allowed.');
      e.target.value = '';
      return;
    }

    const storedUser = localStorage.getItem('user');
    const user = storedUser ? JSON.parse(storedUser) : null;

    if ((isVideo || isGif) && !user) {
      alert(`You must be logged in to upload ${isVideo ? 'videos' : 'GIFs'}.`);
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target.result;

      let finalUrl = dataUrl;
      // Skip compression for GIFs, SVGs, and Videos to preserve quality
      if (!isGif && !isSvg && !isVideo) {
        finalUrl = await compressImage(dataUrl);
      }

      if (isVideo) {
        const tempVid = document.createElement('video');
        tempVid.onloadedmetadata = () => {
          window.dispatchEvent(new CustomEvent('upload-video-to-editor', {
            detail: {
              videoUrl: finalUrl,
              pageIndex: activePageIndex,
              file,
              isTemporary: true,
              videoWidth: tempVid.videoWidth,
              videoHeight: tempVid.videoHeight,
              isPortrait: tempVid.videoHeight > tempVid.videoWidth
            }
          }));
        };
        tempVid.onerror = () => {
          window.dispatchEvent(new CustomEvent('upload-video-to-editor', {
            detail: { videoUrl: finalUrl, pageIndex: activePageIndex, file, isTemporary: true }
          }));
        };
        tempVid.src = finalUrl;
      } else {
        // Dispatch event to MainEditor
        window.dispatchEvent(new CustomEvent('upload-image-to-editor', {
          detail: {
            dataUrl: finalUrl,
            pageIndex: activePageIndex,
            dataType: isSvg ? 'svg' : (isGif ? 'gif' : 'image')
          }
        }));
      }
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input
  };

  const compressImage = (dataUrl, maxWidth = 1200, maxHeight = 1200) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        const isPng = dataUrl.startsWith('data:image/png');

        // If it's already small enough, no need to downscale
        if (width <= maxWidth && height <= maxHeight) {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(isPng ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.75));
          return;
        }

        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(isPng ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.75));
      };
      img.src = dataUrl;
    });
  };

  const selectedElementProps = (() => {
    if (!selectedLayerId) return null;
    const page = pages[activePageIndex];
    if (page && page.html) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(page.html, 'image/svg+xml');
      let el = doc.getElementById(selectedLayerId);
      
      const editorDoc = document.getElementById('main-flipbook-editor')?.contentDocument || document;
      const actualEl = editorDoc.getElementById(selectedLayerId);
      
      // Fallback to real DOM if React state (page.html) is slightly behind
      if (!el && actualEl) {
        el = actualEl;
      }

      const rootId = doc.querySelector('svg > g')?.id;
      const overlayId = doc.querySelector('[data-name="Overlay"]')?.id;
      const isPageSelected = !selectedLayerId || selectedLayerId === rootId || selectedLayerId === overlayId;

      if (el && !isPageSelected) {
        let w = '0', h = '0', x = '0', y = '0', r = '0';

        // --- IMPROVED DIMENSION LOGIC: Try actual DOM first for rendered accuracy ---
        let measuredFromDom = false;
        if (actualEl && typeof actualEl.getBBox === 'function') {
          try {
            const bbox = getVisualBBox(actualEl);
            let m = [1, 0, 0, 1, 0, 0];
            const transform = actualEl.getAttribute('transform');
            if (transform && transform.includes('matrix')) {
              const match = transform.match(/matrix\(([^)]+)\)/);
              if (match) {
                const parsedM = match[1].split(/[\s,]+/).map(parseFloat);
                if (parsedM.length === 6) m = parsedM;
              }
            }
            w = (bbox.width * Math.abs(m[0])).toString();
            h = (bbox.height * Math.abs(m[3])).toString();
            x = (bbox.x * m[0] + (m[0] < 0 ? bbox.width * m[0] : 0) + m[4]).toString();
            y = (bbox.y * m[3] + (m[3] < 0 ? bbox.height * m[3] : 0) + m[5]).toString();
            measuredFromDom = true;
          } catch (e) {
            console.warn("Failed to get BBox for element", e);
          }
        }

        // --- FALLBACK / OVERRIDE: Tags that have preferred source of truth ---
        if (!measuredFromDom || (parseFloat(w) === 0 && parseFloat(h) === 0)) {
          if (el.tagName === 'rect') {
            if (!el.getAttribute('transform')) {
              w = el.getAttribute('width') || w;
              h = el.getAttribute('height') || h;
              x = el.getAttribute('x') || x;
              y = el.getAttribute('y') || y;
            }
          } else if (el.tagName === 'circle') {
            const radius = parseFloat(el.getAttribute('r')) || 0;
            w = (radius * 2).toString();
            h = w;
            if (!el.getAttribute('transform')) {
              x = (parseFloat(el.getAttribute('cx') || '0') - radius).toString();
              y = (parseFloat(el.getAttribute('cy') || '0') - radius).toString();
            }
          } else if (el.tagName === 'ellipse') {
            const rx = parseFloat(el.getAttribute('rx')) || 0;
            const ry = parseFloat(el.getAttribute('ry')) || 0;
            w = (rx * 2).toString();
            h = (ry * 2).toString();
            if (!el.getAttribute('transform')) {
              x = (parseFloat(el.getAttribute('cx') || '0') - rx).toString();
              y = (parseFloat(el.getAttribute('cy') || '0') - ry).toString();
            }
          } else if (el.tagName === 'text') {
            if (!el.getAttribute('transform')) {
              x = el.getAttribute('x') || x;
              y = el.getAttribute('y') || y;
            }
          } else if (el.tagName === 'image' || el.tagName === 'path' || el.tagName === 'g') {
            if (parseFloat(w) === 0) w = el.getAttribute('width') || '0';
            if (parseFloat(h) === 0) h = el.getAttribute('height') || '0';
            if (parseFloat(x) === 0) x = el.getAttribute('x') || '0';
            if (parseFloat(y) === 0) y = el.getAttribute('y') || '0';
          }
        }

        if (el.tagName === 'rect') {
          r = el.getAttribute('rx') || '0';
        }

        let fillStyle = el.getAttribute('fill') || '#000000';
        let strokeStyle = el.getAttribute('stroke') || 'none';
        let strokeWidthStr = el.getAttribute('stroke-width') || el.getAttribute('strokeWidth') || '0';

        if (el.tagName.toLowerCase() === 'foreignobject' && actualEl && actualEl.firstElementChild) {
          const comp = window.getComputedStyle(actualEl.firstElementChild);
          if (!el.hasAttribute('fill')) fillStyle = comp.color || fillStyle;
          if (!el.hasAttribute('stroke') && comp.webkitTextStrokeColor) strokeStyle = comp.webkitTextStrokeColor;
          if (!el.hasAttribute('stroke-width') && !el.hasAttribute('strokeWidth') && comp.webkitTextStrokeWidth) {
            strokeWidthStr = parseFloat(comp.webkitTextStrokeWidth).toString();
          }
          if (parseFloat(strokeWidthStr) === 0 || isNaN(parseFloat(strokeWidthStr)) || strokeStyle === 'transparent' || strokeStyle === 'rgba(0, 0, 0, 0)') {
            strokeStyle = 'none';
          }
        }

        const props = {
          id: selectedLayerId,
          tagName: el.tagName,
          fill: fillStyle,
          stroke: strokeStyle,
          strokeWidth: strokeWidthStr,
          strokeDasharray: el.getAttribute('stroke-dasharray') || 'none',
          opacity: el.getAttribute('opacity') || '1',
          fontSize: el.getAttribute('font-size') || '16',
          textAlign: el.getAttribute('text-anchor') || 'start',
          w: parseFloat(w),
          h: parseFloat(h),
          x: parseFloat(x),
          y: parseFloat(y),
          r: parseFloat(r),
          isGradient: fillStyle?.includes('url(#')
        };

        // Extract all custom attributes (gradients, etc.)
        Array.from(el.attributes).forEach(attr => {
          if (attr.name.startsWith('fill-') || attr.name.startsWith('stroke-') || attr.name.startsWith('data-') || attr.name === 'href' || attr.name.includes('href')) {
            props[attr.name] = attr.value;
          }
        });

        // For shapes added as SVGs wrapped in a <g>, extract inner shape properties
        if (el.tagName.toLowerCase() === 'g') {
           const innerShape = el.querySelector('path, polygon, rect, circle, ellipse, line');
           if (innerShape) {
               props.innerTagName = innerShape.tagName.toLowerCase();
               Array.from(innerShape.attributes).forEach(attr => {
                 if (['data-shape-type', 'data-count', 'data-ratio', 'data-radius', 'data-cx', 'data-cy', 'data-rx', 'rx'].includes(attr.name)) {
                     props[attr.name] = attr.value;
                 }
               });
           }
        }

        // Add a flag for image detection
        const dataType = el.getAttribute('data-type');
        const dataName = el.getAttribute('data-name');
        const fillValue = el.getAttribute('fill') || '';

        // Detect if it's a shape filled with a pattern containing an image
        let isPatternImage = false;
        if (fillValue.startsWith('url(#')) {
          const patternId = fillValue.match(/url\(#([^)]+)\)/)?.[1];
          if (patternId) {
            // Try finding the pattern in the document
            const pattern = doc.getElementById(patternId) || doc.querySelector(`pattern[id="${patternId}"], [id="${patternId}"]`);
            if (pattern) {
              // Templates often use <use xlink:href="#imageId"> inside <pattern>
              const hasUse = pattern.querySelector('use') !== null;
              const hasImage = pattern.querySelector('image, img') !== null;
              if (hasImage || hasUse) {
                isPatternImage = true;
              }
            }
          }
        }

        // Check if it's an image or a group containing an image (very common in templates)
        const hasImageChild = el.querySelector('image, img') !== null;
        const lowerTagName = props.tagName.toLowerCase();
        const lowerId = selectedLayerId?.toLowerCase() || '';
        const lowerDataName = dataName?.toLowerCase() || '';
        const src = el.getAttribute('href') || el.getAttribute('xlink:href') || el.getAttribute('src') || '';
        const urlWithoutQuery = src.split('?')[0].toLowerCase();
        const isGifFile = urlWithoutQuery.endsWith('.gif') || dataType === 'gif' || src.toLowerCase().startsWith('data:image/gif');

        const isPdfBackground = lowerDataName.includes('pdf background') || lowerDataName.endsWith('-pdf') || lowerId.includes('background') || dataType === 'pdf-background';

        const isGif = isGifFile || lowerDataName.includes('gif') || lowerId.includes('gif') || el.getAttribute('data-is-gif-group') === 'true' || el.dataset?.mediaType === 'gif';
        const isAudio = dataType === 'audio' || dataType === 'audio-frame' || lowerDataName.includes('audio') || lowerId.includes('audio') || (el && el.querySelector && el.querySelector('[data-type="audio-frame"]') !== null);
        const isShape = dataType === 'shape' || el.getAttribute('data-shape-type') === 'shape';

        const isMap = dataType === 'map' || lowerId.includes('map');
        if (isMap) {
          props.isMap = true;
          return props;
        }

        const isQRCode = dataType === 'qrcode' || lowerId.includes('qrcode');
        if (isQRCode) {
          props.isQRCode = true;
          return props;
        }

        const isUserGroup = lowerTagName === 'g' && !isShape && !isAudio && (
          dataType === 'group' ||
          lowerDataName === 'group' ||
          lowerId.startsWith('group-') ||
          el.getAttribute('data-type') === 'group' ||
          (!el.getAttribute('data-is-image-group') && !el.getAttribute('data-is-video-group') && !el.getAttribute('data-is-gif-group') && dataType !== 'icon' && dataType !== 'button' && lowerDataName !== 'icon' && !lowerId.includes('icon') && !lowerId.includes('button'))
        ) && el.getAttribute('data-is-image-group') !== 'true' && el.getAttribute('data-is-video-group') !== 'true' && el.getAttribute('data-is-gif-group') !== 'true' && dataType !== 'icon' && dataType !== 'button' && lowerDataName !== 'icon' && !lowerId.includes('icon') && !lowerId.includes('button') && !isMap;

        const isImage = !isUserGroup && (lowerTagName.includes('image') ||
          lowerTagName === 'img' ||
          dataType === 'image' ||
          lowerDataName.includes('image') ||
          lowerId.includes('image') ||
          !!(el.getAttribute('href') || el.getAttribute('xlink:href')) ||
          (lowerTagName === 'g' && hasImageChild && el.getAttribute('data-is-image-group') === 'true') ||
          isPatternImage) && !isGif && !isPdfBackground && !isMap;
        const isVideo = (lowerTagName === 'video' || lowerTagName === 'iframe' || dataType === 'video' || lowerDataName.includes('video') || lowerId.includes('video') || (lowerTagName === 'foreignobject' && el.querySelector('video, iframe'))) && !isMap;
        const isText = (lowerTagName === 'text' || lowerTagName === 'tspan' || (lowerTagName === 'foreignobject' && !isVideo && !isMap)) || dataType === 'text' || lowerDataName.includes('text') || lowerId.includes('text');
        const isIcon = (dataType === 'icon' || dataType === 'hotspot' || lowerDataName.includes('icon') || lowerDataName.includes('hotspot') || lowerId.includes('icon') || lowerId.includes('hotspot') || lowerTagName.includes('lucide') || el.classList.contains('lucide') || el.classList.contains('iconify')) && !isShape;
        const isButton = dataType === 'button' || lowerId.includes('button');
        const isActuallyImage = lowerTagName === 'image' || lowerTagName === 'img' || el.hasAttribute('href') || el.hasAttribute('xlink:href');
        const isImageFrame = !isActuallyImage && (dataType === 'image-frame' || el.getAttribute('data-type') === 'image-frame' || lowerDataName.includes('image-frame') || lowerId.includes('image-frame') || (el.closest && el.closest('[data-type="image-frame"]') !== null));
        const isEmbed = dataType === 'embed-frame' || lowerDataName.includes('embed-frame') || lowerId.includes('embed-frame') || el.querySelector('[data-type="embed-frame"]') !== null;

        props.isUserGroup = isUserGroup;
        props.isMap = isMap;
        props.isButton = isButton;
        props.isImage = isImage;
        props.isText = isText;
        props.isVideo = isVideo;
        props.isGif = isGif;
        props.isIcon = isIcon;
        props.isShape = isShape;
        props.isEmbed = isEmbed;
        props.isImageFrame = isImageFrame;
        props.isPdfBackground = isPdfBackground;
        props.isAudio = isAudio;

        return props;
      }
    }
    return null;
  })();

  const isDimensionDisabled = !selectedElementProps || selectedElementProps.isPdfBackground || activeTopTool === 'interaction' || activeTopTool === 'animation';

  return (
    <div
      className="bg-white border-l border-[#EEEEEE] flex flex-col overflow-hidden select-none flex-shrink-0 h-[92vh]"
      style={{ width: '24vw' }}
      onMouseDown={() => {
        if (activeMainTool === 'grid' && typeof setActiveMainTool === 'function') {
          setActiveMainTool('select');
        }
      }}
    >
      {activeMainTool === 'grid' && (
        <IconGallery
          isOpen={true}
          onClose={() => setActiveMainTool('select')}
          onSelect={(icon) => {
            window.dispatchEvent(new CustomEvent('add-icon-to-editor', {
              detail: {
                pageIndex: activePageIndex,
                icon: icon
              }
            }));
          }}
        />
      )}
      {/* ================= Popup Apply/Cancel Banner ================= */}
      {isPopupEditor && (
        <div className="flex-shrink-0 bg-white border-b border-gray-100 px-[1.5vw] flex items-center justify-between" style={{ height: '8.5vh' }}>
          <span className="text-[0.75vw] text-gray-500 font-medium flex items-center gap-[0.2vw]">
            Click <span className="text-[#22C55E] font-bold text-[0.8vw] mx-[0.1vw]">(✓)</span> to apply changes
          </span>
          <div className="flex items-center gap-[0.5vw]">
            <button
              onClick={onApplyPopupChanges}
              className="flex items-center justify-center w-[2vw] h-[2vw] bg-[#22C55E] hover:bg-[#16a34a] text-white rounded-[0.4vw] transition-colors shadow-sm cursor-pointer"
              title="Apply Changes"
            >
              <Icon icon="lucide:check" width="1.1vw" strokeWidth={3} />
            </button>
            <button
              onClick={onCancelPopupChanges}
              className="flex items-center justify-center w-[2vw] h-[2vw] bg-white border border-[#EF4444] hover:bg-red-50 text-[#EF4444] rounded-[0.4vw] transition-colors shadow-sm cursor-pointer"
              title="Cancel"
            >
              <Icon icon="lucide:x" width="1.1vw" />
            </button>
          </div>
        </div>
      )}

      {/* Persistent Dimension Section (Common for all) */}
      {!is3DModalOpen && (
        <div className="bg-white px-[1.5vw] pt-[1.4vw] pb-[0.85vw] border-b border-gray-100 flex-shrink-0">
          <div className="space-y-[0.8vw]">
            <div className="flex flex-col gap-[1vw]">
              {/* Position Row */}
              <div className="flex items-center gap-[2vw]">
                <span className="text-[0.9vw] font-medium text-gray-800 whitespace-nowrap w-[4vw]">Position :</span>
                <div className="flex items-center gap-[1.5vw]">
                  {/* X Input */}
                  <div className="flex items-center gap-[0.2vw]">
                    {!isDimensionDisabled ? (
                      <ChevronLeft
                        size="0.85vw"
                        className="text-gray-400 cursor-pointer hover:text-[#5145F6] transition-colors"
                        onClick={() => {
                          const val = parseFloat(selectedElementProps?.x || 0) - 1;
                          updatePosition(val.toString(), 'x');
                        }}
                      />
                    ) : (
                      <ChevronLeft size="0.85vw" className="text-transparent" />
                    )}
                    <div className={`w-[4.5vw] h-[1.8vw] border border-gray-300 rounded-[0.4vw] flex items-center shadow-sm ${isDimensionDisabled ? 'bg-gray-50/50' : 'bg-white'}`}>
                      <span className="text-gray-500 font-medium text-[0.8vw] ml-[0.5vw]">X</span>
                      <DimensionInput
                        targetId={selectedLayerId}
                        targetAttr="x"
                        className={`w-full text-center outline-none text-[0.85vw] font-semibold ${isDimensionDisabled ? 'text-gray-400 cursor-not-allowed bg-transparent' : 'text-[#111827] bg-white'}`}
                        value={convertValue(selectedElementProps?.x || 0)}
                        readOnly={isDimensionDisabled}
                        onChange={(val) => updatePosition(val, 'x')}
                      />
                    </div>
                    {!isDimensionDisabled ? (
                      <ChevronRight
                        size="0.85vw"
                        className="text-gray-400 cursor-pointer hover:text-[#5145F6] transition-colors"
                        onClick={() => {
                          const val = parseFloat(selectedElementProps?.x || 0) + 1;
                          updatePosition(val.toString(), 'x');
                        }}
                      />
                    ) : (
                      <ChevronRight size="0.85vw" className="text-transparent" />
                    )}
                  </div>

                  {/* Y Input */}
                  <div className="flex items-center gap-[0.2vw]">
                    {!isDimensionDisabled ? (
                      <ChevronLeft
                        size="0.85vw"
                        className="text-gray-400 cursor-pointer hover:text-[#5145F6] transition-colors"
                        onClick={() => {
                          const val = parseFloat(selectedElementProps?.y || 0) - 1;
                          updatePosition(val.toString(), 'y');
                        }}
                      />
                    ) : (
                      <ChevronLeft size="0.85vw" className="text-transparent" />
                    )}
                    <div className={`w-[4.5vw] h-[1.8vw] border border-gray-300 rounded-[0.4vw] flex items-center shadow-sm ${isDimensionDisabled ? 'bg-gray-50/50' : 'bg-white'}`}>
                      <span className="text-gray-500 font-medium text-[0.8vw] ml-[0.5vw]">Y</span>
                      <DimensionInput
                        targetId={selectedLayerId}
                        targetAttr="y"
                        className={`w-full text-center outline-none text-[0.85vw] font-semibold ${isDimensionDisabled ? 'text-gray-400 cursor-not-allowed bg-transparent' : 'text-[#111827] bg-white'}`}
                        value={convertValue(selectedElementProps?.y || 0)}
                        readOnly={isDimensionDisabled}
                        onChange={(val) => updatePosition(val, 'y')}
                      />
                    </div>
                    {!isDimensionDisabled ? (
                      <ChevronRight
                        size="0.85vw"
                        className="text-gray-400 cursor-pointer hover:text-[#5145F6] transition-colors"
                        onClick={() => {
                          const val = parseFloat(selectedElementProps?.y || 0) + 1;
                          updatePosition(val.toString(), 'y');
                        }}
                      />
                    ) : (
                      <ChevronRight size="0.85vw" className="text-transparent" />
                    )}
                  </div>
                </div>
              </div>

              {/* Resizing Row */}
              <div className="flex items-center gap-[2vw]">
                <span className="text-[0.9vw] font-medium text-gray-800 whitespace-nowrap w-[4vw]">Resizing :</span>
                <div className="flex items-center gap-[1.5vw]">
                  {/* W Input */}
                  <div className="flex items-center gap-[0.2vw]">
                    {!isDimensionDisabled ? (
                      <ChevronLeft
                        size="0.85vw"
                        className="text-gray-400 cursor-pointer hover:text-[#5145F6] transition-colors"
                        onClick={() => {
                          const val = parseFloat(selectedElementProps?.w || 0) - 1;
                          updateDimensionWithScale(val.toString(), 'width');
                        }}
                      />
                    ) : (
                      <ChevronLeft size="0.85vw" className="text-transparent" />
                    )}
                    <div className={`w-[4.5vw] h-[1.8vw] border border-gray-300 rounded-[0.4vw] flex items-center shadow-sm ${isDimensionDisabled ? 'bg-gray-50/50' : 'bg-white'}`}>
                      <span className="text-gray-500 font-medium text-[0.8vw] ml-[0.5vw]">W</span>
                      <DimensionInput
                        targetId={selectedLayerId}
                        targetAttr="width"
                        className={`w-full text-center outline-none text-[0.85vw] font-semibold ${isDimensionDisabled ? 'text-gray-400 cursor-not-allowed bg-transparent' : 'text-[#111827] bg-white'}`}
                        value={convertValue(selectedElementProps?.w || flipbookDimensions.width)}
                        readOnly={isDimensionDisabled}
                        onChange={(val) => updateDimensionWithScale(val, 'width')}
                      />
                    </div>
                    {!isDimensionDisabled ? (
                      <ChevronRight
                        size="0.85vw"
                        className="text-gray-400 cursor-pointer hover:text-[#5145F6] transition-colors"
                        onClick={() => {
                          const val = parseFloat(selectedElementProps?.w || 0) + 1;
                          updateDimensionWithScale(val.toString(), 'width');
                        }}
                      />
                    ) : (
                      <ChevronRight size="0.85vw" className="text-transparent" />
                    )}
                  </div>

                  {/* H Input */}
                  <div className="flex items-center gap-[0.2vw]">
                    {!isDimensionDisabled ? (
                      <ChevronLeft
                        size="0.85vw"
                        className="text-gray-400 cursor-pointer hover:text-[#5145F6] transition-colors"
                        onClick={() => {
                          const val = parseFloat(selectedElementProps?.h || 0) - 1;
                          updateDimensionWithScale(val.toString(), 'height');
                        }}
                      />
                    ) : (
                      <ChevronLeft size="0.85vw" className="text-transparent" />
                    )}
                    <div className={`w-[4.5vw] h-[1.8vw] border border-gray-300 rounded-[0.4vw] flex items-center shadow-sm ${isDimensionDisabled ? 'bg-gray-50/50' : 'bg-white'}`}>
                      <span className="text-gray-500 font-medium text-[0.8vw] ml-[0.5vw]">H</span>
                      <DimensionInput
                        targetId={selectedLayerId}
                        targetAttr="height"
                        className={`w-full text-center outline-none text-[0.85vw] font-semibold ${isDimensionDisabled ? 'text-gray-400 cursor-not-allowed bg-transparent' : 'text-[#111827] bg-white'}`}
                        value={convertValue(selectedElementProps?.h || flipbookDimensions.height)}
                        readOnly={isDimensionDisabled}
                        onChange={(val) => updateDimensionWithScale(val, 'height')}
                      />
                    </div>
                    {!isDimensionDisabled ? (
                      <ChevronRight
                        size="0.85vw"
                        className="text-gray-400 cursor-pointer hover:text-[#5145F6] transition-colors"
                        onClick={() => {
                          const val = parseFloat(selectedElementProps?.h || 0) + 1;
                          updateDimensionWithScale(val.toString(), 'height');
                        }}
                      />
                    ) : (
                      <ChevronRight size="0.85vw" className="text-transparent" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={`flex-1 flex flex-col overflow-hidden bg-[#fbfbfb] ${pages[activePageIndex]?.isHidden ? 'opacity-50 pointer-events-none' : ''}`}>
        {is3DModalOpen ? (
          <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar">
            <Model3DEditor
              onClose={() => setIs3DModalOpen(false)}
              shadowStrength={shadowStrength} setShadowStrength={setShadowStrength}
              shadowSoftness={shadowSoftness} setShadowSoftness={setShadowSoftness}
              autoRotate={autoRotate} setAutoRotate={setAutoRotate}
              autoRotateSpeed={autoRotateSpeed} setAutoRotateSpeed={setAutoRotateSpeed}
              lockMaxZoom={lockMaxZoom} setLockMaxZoom={setLockMaxZoom}
              maxZoom={maxZoom} setMaxZoom={setMaxZoom}
              bgType={bgType} setBgType={setBgType}
              bgColor={bgColor} setBgColor={setBgColor}
              customBg={customBg} setCustomBg={setCustomBg}
              enableAR={enableAR} setEnableAR={setEnableAR}
              qrText={qrText} setQrText={setQrText} qrColor={qrColor} setQrColor={setQrColor} qrBgType={qrBgType} setQrBgType={setQrBgType} qrBgColor={qrBgColor} setQrBgColor={setQrBgColor} qrLevel={qrLevel} setQrLevel={setQrLevel} qrDotType={qrDotType} setQrDotType={setQrDotType} qrCornerSquareType={qrCornerSquareType} setQrCornerSquareType={setQrCornerSquareType} qrCornerDotType={qrCornerDotType} setQrCornerDotType={setQrCornerDotType} qrLogo={qrLogo} setQrLogo={setQrLogo}
              topText={topText} setTopText={setTopText} bottomText={bottomText} setBottomText={setBottomText}
              dataUrl={preview3DDataUrl}
              vId={current3DVId}
              hotspots={hotspots}
              activeHotspotId={activeHotspotId}
              onHotspotClick={onHotspotClick}
            />
          </div>
        ) : activeTopTool === 'editor' ? (
          activeMainTool === 'element' ? (
            <Elements />
          ) : activeMainTool === 'upload' ? (
            <div className="p-[1.5vw] flex flex-col gap-[0.75vw] overflow-y-auto no-scrollbar h-full justify-between">
              {/* Top Content */}
              <div className="flex flex-col gap-[0.75vw]">
                {/* Header */}
                <div className="flex items-center gap-[0.5vw] mb-[0.1vw]">
                  <h2 className="text-[0.9vw] font-semibold text-gray-900 whitespace-nowrap">Upload Files</h2>
                  <div className="h-[0.0925vw] bg-gray-200 flex-1" style={{ marginRight: '-1.5vw' }}></div>
                </div>

                {/* Drag & Drop Box */}
                <div
                  onClick={handleUploadClick}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const files = e.dataTransfer.files;
                    if (files && files.length > 0) {
                      handleFileChange({ target: { files: files } });
                    }
                  }}
                  className="w-full border-2 border-dashed border-gray-400 rounded-[0.75vw] bg-white p-[0.9vw] flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:border-[#4c5add] hover:bg-gray-50/50 group shadow-sm"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*,video/*,.gif,.svg"
                    onChange={handleFileChange}
                  />
                  <div className="text-[0.75vw] font-medium text-gray-700 mb-[0.5vw]">
                    Drag & Drop or <span className="text-[#4c5add] font-bold">Upload</span>
                  </div>
                  <div className="mb-[0.5vw] text-gray-400 group-hover:text-[#4c5add] transition-colors">
                    <Upload size="1.3vw" strokeWidth={1.5} />
                  </div>
                  <div className="text-center">
                    <div className="text-[0.65vw] font-semibold text-gray-600 mb-[0.05vw]">Supported File</div>
                    <div className="text-[0.58vw] text-gray-400 font-normal">Image, Video, GIF, SVG</div>
                  </div>
                </div>

                {/* OR Divider */}
                <div className="text-[0.6vw] font-medium text-gray-400 text-center uppercase tracking-wider my-[0.15vw]">
                  OR
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-[0.5vw]">
                  {/* Browse by Gallery */}
                  <button
                    ref={browseGalleryBtnRef}
                    onClick={() => setIsMediaGalleryOpen(true)}
                    className="w-full rounded-[0.65vw] p-[0.6vw] px-[0.75vw] bg-[#0c0f17] hover:bg-black text-white flex items-center justify-between shadow-md cursor-pointer transition-all border border-gray-800 group relative overflow-hidden"
                  >
                    <div className="flex items-center gap-[0.6vw]">
                      <div className="w-[1.8vw] h-[1.8vw] rounded-[0.45vw] bg-white text-gray-900 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <ImageIcon size="0.95vw" />
                      </div>
                      <span className="text-[0.75vw] font-semibold text-white tracking-wide">Browse by Gallery</span>
                    </div>
                    <ChevronRight size="0.8vw" className="text-gray-400 group-hover:text-white transition-colors" />
                  </button>

                  {/* Import via URL */}
                  <button
                    onClick={() => setIsUrlModalOpen(true)}
                    className="w-full rounded-[0.65vw] p-[0.6vw] px-[0.75vw] bg-[#3195ff] hover:bg-[#2087f5] text-white flex items-center justify-between shadow-md cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-[0.6vw]">
                      <div className="w-[1.8vw] h-[1.8vw] rounded-[0.45vw] bg-white text-[#3195ff] flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Link size="0.95vw" />
                      </div>
                      <span className="text-[0.75vw] font-semibold text-white tracking-wide">Import via URL</span>
                    </div>
                    <ChevronRight size="0.8vw" className="text-white/80 group-hover:text-white transition-colors" />
                  </button>
                </div>
              </div>

              {/* URL Import Card (Pushed to bottom) */}
              <div className="mt-auto border border-gray-100 rounded-[0.75vw] p-[0.75vw] shadow-sm bg-white flex flex-col gap-[0.45vw]">
                <div className="flex items-center gap-[0.4vw]">
                  <Link size="0.9vw" className="text-[#3195ff]" />
                  <span className="text-[0.78vw] font-bold text-[#3195ff]">URL Import</span>
                </div>
                <p className="text-[0.6vw] text-gray-500 font-normal">
                  You can import the following from a URL:
                </p>

                {/* 3 Horizontal Mini Cards */}
                <div className="grid grid-cols-3 gap-[0.35vw] my-[0.1vw]">
                  {/* Images */}
                  <div className="bg-gray-50/70 border border-gray-200/80 rounded-[0.45vw] p-[0.35vw] flex items-center gap-[0.3vw]">
                    <div className="w-[1.3vw] h-[1.3vw] rounded-[0.3vw] bg-blue-100/60 text-blue-600 flex items-center justify-center flex-shrink-0">
                      <ImageIcon size="0.7vw" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[0.55vw] font-bold text-gray-800 leading-tight">Images</span>
                      <span className="text-[0.45vw] text-gray-400 font-normal truncate">JPG, PNG, SVG</span>
                    </div>
                  </div>

                  {/* PDF */}
                  <div className="bg-gray-50/70 border border-gray-200/80 rounded-[0.45vw] p-[0.35vw] flex items-center gap-[0.3vw]">
                    <div className="w-[1.3vw] h-[1.3vw] rounded-[0.3vw] bg-red-100/60 text-red-500 flex items-center justify-center flex-shrink-0">
                      <FileText size="0.7vw" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[0.55vw] font-bold text-gray-800 leading-tight">PDF</span>
                      <span className="text-[0.45vw] text-gray-400 font-normal truncate">PDF Documents</span>
                    </div>
                  </div>

                  {/* Videos */}
                  <div className="bg-gray-50/70 border border-gray-200/80 rounded-[0.45vw] p-[0.35vw] flex items-center gap-[0.3vw]">
                    <div className="w-[1.3vw] h-[1.3vw] rounded-[0.3vw] bg-amber-100/60 text-amber-500 flex items-center justify-center flex-shrink-0">
                      <Video size="0.7vw" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[0.55vw] font-bold text-gray-800 leading-tight">Videos</span>
                      <span className="text-[0.45vw] text-gray-400 font-normal truncate">YouTube, Vimeo</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Note Banner */}
                <div className="bg-blue-50/70 border border-blue-100 rounded-[0.4vw] p-[0.35vw] px-[0.5vw] flex items-center gap-[0.35vw]">
                  <Icon icon="lucide:info" className="w-[0.7vw] h-[0.7vw] text-blue-500 flex-shrink-0" />
                  <p className="text-[0.55vw] text-gray-600 leading-tight">
                    <strong className="font-bold text-blue-600">Note:</strong> Use direct, publicly accessible links for best results.
                  </p>
                </div>
              </div>
            </div>
          ) : activeMainTool === 'element' ? (
            <Elements />
          ) : (
            <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar">
              {isPdfProject ? (
                <InteractionPanel
                  selectedElementProps={selectedElementProps}
                  activePageIndex={activePageIndex}
                  selectedLayerId={selectedLayerId}
                  updateElementAttribute={updateElementAttribute}
                  deleteLayer={deleteLayer}
                  pages={pages}
                  flipbookDimensions={flipbookDimensions}
                  onCustomizePopup={onCustomizePopup}
                  setIs3DModalOpen={setIs3DModalOpen}
                  setCurrent3DItem={setCurrent3DItem}
                  v_id={effectiveVId}
                  folderName={effectiveFolder}
                  flipbookName={effectiveBook}
                />
              ) : (
                <div className="flex flex-col p-[1.5vw] gap-[1.5vw]">
                  {(selectedElementProps || activeMainTool === 'grid') ? (
                    <div className="flex flex-col gap-[1.5vw]">
                      {selectedElementProps?.isEmbed ? (
                        <ThirdPartyEmbedProperties
                          selectedElement={(() => {
                            const editorDoc = document.getElementById('main-flipbook-editor')?.contentDocument || document;
                            if (selectedLayerId) return editorDoc.getElementById(selectedLayerId);
                            return null;
                          })()}
                          selectedLayerId={selectedLayerId}
                          activePageIndex={activePageIndex}
                          updateElementAttribute={updateElementAttribute}
                          selectedElementProps={selectedElementProps}
                        />
                      ) : selectedElementProps?.isImageFrame ? (
                        <ImageFramingProperties
                          selectedElement={(() => {
                            const editorDoc = document.getElementById('main-flipbook-editor')?.contentDocument || document;
                            if (selectedLayerId) {
                              const el = editorDoc.getElementById(selectedLayerId);
                              return el?.closest('[data-type="image-frame"]') || el;
                            }
                            return null;
                          })()}
                          selectedLayerId={(() => {
                             const editorDoc = document.getElementById('main-flipbook-editor')?.contentDocument || document;
                             if (selectedLayerId) {
                               const el = editorDoc.getElementById(selectedLayerId);
                               const parent = el?.closest('[data-type="image-frame"]');
                               return parent ? parent.id : selectedLayerId;
                             }
                             return selectedLayerId;
                          })()}
                          activePageIndex={activePageIndex}
                          updateElementAttribute={updateElementAttribute}
                          selectedElementProps={selectedElementProps}
                        />
                      ) : (selectedElementProps?.isUserGroup || (multiSelectedIds && multiSelectedIds.size > 1)) ? (
                        <GroupProperties
                          selectedElement={(() => {
                            const editorDoc = document.getElementById('main-flipbook-editor')?.contentDocument || document;
                            if (selectedLayerId) return editorDoc.getElementById(selectedLayerId);
                            return null;
                          })()}
                          multiSelectedIds={multiSelectedIds}
                          isMultiSelect={multiSelectedIds && multiSelectedIds.size > 1}
                          selectedLayerId={selectedLayerId}
                          activePageIndex={activePageIndex}
                          onUpdate={(newHtml) => {
                            window.__skipCanvasUpdateForPage = activePageIndex;
                            if (typeof newHtml === 'string') {
                              updateElementAttribute(activePageIndex, selectedLayerId, '__dom_sync__', newHtml);
                            } else {
                              const svgRoot = (() => {
                                const targetId = selectedLayerId || (multiSelectedIds && multiSelectedIds.size > 0 ? Array.from(multiSelectedIds)[0] : null);
                                const el = document.getElementById(targetId);
                                if (!el) return null;
                                const container = el.closest('.page-svg-container');
                                if (container) {
                                  const canvasContent = container.querySelector('[id^="canvas-content-"]');
                                  return canvasContent ? canvasContent.querySelector('svg') : container.querySelector('svg');
                                }
                                let node = el;
                                let lastSvg = null;
                                while (node) {
                                  if (node.tagName?.toLowerCase() === 'svg') lastSvg = node;
                                  node = node.parentElement;
                                }
                                return lastSvg;
                              })();
                              if (svgRoot) {
                                const cloneSvg = svgRoot.cloneNode(true);
                                cloneSvg.querySelectorAll('[data-highlight-id], .frame-boundary').forEach(el => el.remove());
                                const serializer = new XMLSerializer();
                                const html = serializer.serializeToString(cloneSvg);
                                updateElementAttribute(activePageIndex, selectedLayerId, '__dom_sync__', html);
                              } else {
                                updateElementAttribute(activePageIndex, selectedLayerId, '__dom_sync__', null);
                              }
                            }
                          }}
                          onDeleteLayer={() => {
                            if (multiSelectedIds && multiSelectedIds.size > 1) {
                              multiSelectedIds.forEach(id => deleteLayer?.(activePageIndex, id));
                              if (setMultiSelectedIds) setMultiSelectedIds(new Set());
                              if (setSelectedLayerId) setSelectedLayerId(null);
                            } else {
                              deleteLayer?.(activePageIndex, selectedLayerId);
                            }
                          }}
                          setSelectedLayerId={setSelectedLayerId}
                          setMultiSelectedIds={setMultiSelectedIds}
                        />
                      ) : selectedElementProps?.isImage ? (
                        <ImageEditor
                          selectedElement={(() => {
                            const editorDoc = document.getElementById('main-flipbook-editor')?.contentDocument || document;
                            return editorDoc.getElementById(selectedLayerId);
                          })()}
                          selectedLayerId={selectedLayerId}
                          activePageIndex={activePageIndex}
                          onUpdate={(newHtml) => {
                            window.__skipCanvasUpdateForPage = activePageIndex;
                            if (typeof newHtml === 'string') {
                              updateElementAttribute(activePageIndex, selectedLayerId, '__dom_sync__', newHtml);
                            } else {
                              const svgRoot = (() => {
                                const el = document.getElementById(selectedLayerId);
                                if (!el) return null;
                                const container = el.closest('.page-svg-container');
                                if (container) {
                                  const canvasContent = container.querySelector('[id^="canvas-content-"]');
                                  return canvasContent ? canvasContent.querySelector('svg') : container.querySelector('svg');
                                }

                                let node = el;
                                let lastSvg = null;
                                while (node) {
                                  if (node.tagName?.toLowerCase() === 'svg') lastSvg = node;
                                  node = node.parentElement;
                                }
                                return lastSvg;
                              })();
                              if (svgRoot) {
                                const cloneSvg = svgRoot.cloneNode(true);
                                cloneSvg.querySelectorAll('[data-highlight-id], .frame-boundary').forEach(el => el.remove());
                                const serializer = new XMLSerializer();
                                const html = serializer.serializeToString(cloneSvg);
                                updateElementAttribute(activePageIndex, selectedLayerId, '__dom_sync__', html);
                              } else {
                                updateElementAttribute(activePageIndex, selectedLayerId, '__dom_sync__', null);
                              }
                            }
                          }}
                          pages={pages}
                          currentPageVId={pages[activePageIndex]?.v_id || pages[activePageIndex]?.id || ''}
                          folderName={effectiveFolder}
                          flipbookName={effectiveBook}
                          flipbookVId={effectiveVId}
                          onDeleteLayer={() => deleteLayer?.(activePageIndex, selectedLayerId)}
                        />
                      ) : selectedElementProps?.isButton ? (
                        <ButtonEditor
                          selectedElement={(() => {
                            const editorDoc = document.getElementById('main-flipbook-editor')?.contentDocument || document;
                            return editorDoc.getElementById(selectedLayerId);
                          })()}
                          onUpdate={(newHtml) => {
                            window.__skipCanvasUpdateForPage = activePageIndex;
                            if (typeof newHtml === 'string') {
                              updateElementAttribute(activePageIndex, selectedLayerId, '__dom_sync__', newHtml);
                            }
                          }}
                        />
                      ) : selectedElementProps?.isMap ? (
                        <MapEditor
                          selectedElement={(() => {
                            const editorDoc = document.getElementById('main-flipbook-editor')?.contentDocument || document;
                            return editorDoc.getElementById(selectedLayerId);
                          })()}
                          onUpdate={(newHtml) => {
                            window.__skipCanvasUpdateForPage = activePageIndex;
                            if (typeof newHtml === 'string') {
                              updateElementAttribute(activePageIndex, selectedLayerId, '__dom_sync__', newHtml);
                            }
                          }}
                        />
                      ) : selectedElementProps?.isQRCode ? (
                        <QRCodeProperties
                          selectedElement={(() => {
                            const editorDoc = document.getElementById('main-flipbook-editor')?.contentDocument || document;
                            return editorDoc.getElementById(selectedLayerId);
                          })()}
                          onUpdate={(newHtml) => {
                            window.__skipCanvasUpdateForPage = activePageIndex;
                            if (typeof newHtml === 'string') {
                              updateElementAttribute(activePageIndex, selectedLayerId, '__dom_sync__', newHtml);
                            }
                          }}
                        />
                      ) : selectedElementProps?.isText ? (
                        <TextEditor
                          selectedElement={(() => {
                            const editorDoc = document.getElementById('main-flipbook-editor')?.contentDocument || document;
                            const el = editorDoc.getElementById(selectedLayerId);
                            if (!el) return null;
                            const tag = el.tagName?.toLowerCase();
                            // foreignObject wraps the actual HTML text container — drill into it
                            if (tag === 'foreignobject') {
                              return el.querySelector('[contenteditable], div, p, span') || el;
                            }
                            return el;
                          })()}
                          onUpdate={(newHtml) => {
                            window.__skipCanvasUpdateForPage = activePageIndex;
                            if (typeof newHtml === 'string') {
                              updateElementAttribute(activePageIndex, selectedLayerId, '__dom_sync__', newHtml);
                            } else {
                              const svgRoot = (() => {
                                const el = document.getElementById(selectedLayerId);
                                if (!el) return null;
                                const container = el.closest('.page-svg-container');
                                if (container) return container.querySelector('svg');

                                let node = el;
                                let lastSvg = null;
                                while (node) {
                                  if (node.tagName?.toLowerCase() === 'svg') lastSvg = node;
                                  node = node.parentElement;
                                }
                                return lastSvg;
                              })();
                              if (svgRoot) {
                                const cloneSvg = svgRoot.cloneNode(true);
                                cloneSvg.querySelectorAll('[data-highlight-id], .frame-boundary').forEach(el => el.remove());
                                const serializer = new XMLSerializer();
                                const html = serializer.serializeToString(cloneSvg);
                                updateElementAttribute(activePageIndex, selectedLayerId, '__dom_sync__', html);
                              } else {
                                updateElementAttribute(activePageIndex);
                              }
                            }
                          }}
                          pages={pages}
                          setPages={setPages}
                          activePageIndex={activePageIndex}
                        />
                      ) : selectedElementProps?.isVideo ? (
                        <VideoEditor
                          selectedElement={(() => {
                            const editorDoc = document.getElementById('main-flipbook-editor')?.contentDocument || document;
                            return editorDoc.getElementById(selectedLayerId);
                          })()}
                          selectedLayerId={selectedLayerId}
                          activePageIndex={activePageIndex}
                          onUpdate={(newHtml) => {
                            window.__skipCanvasUpdateForPage = activePageIndex;
                            if (typeof newHtml === 'string') {
                              updateElementAttribute(activePageIndex, selectedLayerId, '__dom_sync__', newHtml);
                            } else {
                              const svgRoot = (() => {
                                const el = document.getElementById(selectedLayerId);
                                if (!el) return null;
                                const container = el.closest('.page-svg-container');
                                if (container) return container.querySelector('svg');

                                let node = el;
                                let lastSvg = null;
                                while (node) {
                                  if (node.tagName?.toLowerCase() === 'svg') lastSvg = node;
                                  node = node.parentElement;
                                }
                                return lastSvg;
                              })();
                              if (svgRoot) {
                                const cloneSvg = svgRoot.cloneNode(true);
                                cloneSvg.querySelectorAll('[data-highlight-id], .frame-boundary').forEach(el => el.remove());
                                const serializer = new XMLSerializer();
                                const html = serializer.serializeToString(cloneSvg);
                                updateElementAttribute(activePageIndex, selectedLayerId, '__dom_sync__', html);
                              } else {
                                updateElementAttribute(activePageIndex, selectedLayerId, '__dom_sync__', null);
                              }
                            }
                          }}
                          pages={pages}
                          currentPageVId={pages[activePageIndex]?.v_id || pages[activePageIndex]?.id || ''}
                          folderName={effectiveFolder}
                          flipbookName={effectiveBook}
                          flipbookVId={effectiveVId}
                          onDeleteLayer={() => deleteLayer?.(activePageIndex, selectedLayerId)}
                        />
                      ) : selectedElementProps?.isEmbed ? (
                        <ThirdPartyEmbedProperties
                          selectedElementProps={selectedElementProps}
                          activePageIndex={activePageIndex}
                          selectedLayerId={selectedLayerId}
                          updateElementAttribute={updateElementAttribute}
                          selectedElement={(() => {
                            const editorDoc = document.getElementById('main-flipbook-editor')?.contentDocument || document;
                            return editorDoc.getElementById(selectedLayerId);
                          })()}
                        />
                      ) : selectedElementProps?.isGif ? (
                        <GifEditor
                          selectedElement={(() => {
                            const editorDoc = document.getElementById('main-flipbook-editor')?.contentDocument || document;
                            return editorDoc.getElementById(selectedLayerId);
                          })()}
                          selectedLayerId={selectedLayerId}
                          onUpdate={(newHtml) => {
                            window.__skipCanvasUpdateForPage = activePageIndex;
                            if (typeof newHtml === 'string') {
                              updateElementAttribute(activePageIndex, selectedLayerId, '__dom_sync__', newHtml);
                            } else {
                              const svgRoot = (() => {
                                const el = document.getElementById(selectedLayerId);
                                if (!el) return null;
                                const container = el.closest('.page-svg-container');
                                if (container) return container.querySelector('svg');

                                let node = el;
                                let lastSvg = null;
                                while (node) {
                                  if (node.tagName?.toLowerCase() === 'svg') lastSvg = node;
                                  node = node.parentElement;
                                }
                                return lastSvg;
                              })();
                              if (svgRoot) {
                                const cloneSvg = svgRoot.cloneNode(true);
                                cloneSvg.querySelectorAll('[data-highlight-id], .frame-boundary').forEach(el => el.remove());
                                const serializer = new XMLSerializer();
                                const html = serializer.serializeToString(cloneSvg);
                                updateElementAttribute(activePageIndex, selectedLayerId, '__dom_sync__', html);
                              } else {
                                updateElementAttribute(activePageIndex, selectedLayerId, '__dom_sync__', null);
                              }
                            }
                          }}
                          pages={pages}
                          activePageIndex={activePageIndex}
                          folderName={effectiveFolder}
                          flipbookName={effectiveBook}
                          flipbookVId={effectiveVId}
                          onDeleteLayer={() => deleteLayer?.(activePageIndex, selectedLayerId)}
                        />
                      ) : selectedElementProps?.isAudio ? (
                        <AudioProperties
                          selectedElement={(() => {
                            const pageContainer = document.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`);
                            return pageContainer?.querySelector(`[id="${selectedLayerId}"]`) || document.getElementById(selectedLayerId);
                          })()}
                          selectedLayerId={selectedLayerId}
                          activePageIndex={activePageIndex}
                          updateElementAttribute={updateElementAttribute}
                        />
                      ) : (
                        <>
                          <PenToolProperties
                            isVectorPath={true}
                            isNodeEditActive={isNodeEditActive}
                            isPenChosen={activeMainTool === 'pen'}
                          />
                          <ShapeProperties
                            selectedElementProps={selectedElementProps || {
                              fill: '#6366F1',
                              opacity: '1',
                              stroke: 'none',
                              strokeWidth: '0',
                              tagName: 'g',
                              isIcon: true
                            }}
                            activePageIndex={activePageIndex}
                            selectedLayerId={selectedLayerId}
                            updateElementAttribute={updateElementAttribute}
                            activeMainTool={activeMainTool}
                          />
                        </>
                      )}
                    </div>
                  ) : (
                    /* Page Properties (Default View) */
                    (() => {
                      const page = pages[activePageIndex];
                      const parser = new DOMParser();
                      const doc = parser.parseFromString(page?.html || '', 'image/svg+xml');
                      const overlay = doc.querySelector('[data-name="Overlay"]');
                      const currentBg = overlay?.getAttribute('fill') || '#ffffff';
                      const fillType = overlay?.getAttribute('fill-type') || 'solid';

                      let currentBgStr = currentBg;
                      if (fillType === 'gradient' || currentBg.toLowerCase().includes('url(#')) {
                        const stopsJson = overlay?.getAttribute('fill-stops');
                        const stops = stopsJson ? JSON.parse(stopsJson) : [];
                        const gType = overlay?.getAttribute('fill-gradient-type') || 'linear';
                        if (stops.length > 0) {
                          currentBgStr = generateGradientString(
                            gType.charAt(0).toUpperCase() + gType.slice(1),
                            stops.map(s => ({ ...s, opacity: (s.opacity !== undefined ? s.opacity : 1) * 100 })),
                            parseInt(overlay?.getAttribute('fill-angle') || '0'),
                            parseInt(overlay?.getAttribute('fill-radius') || '100')
                          );
                        }
                      }

                      return (
                        <div className="flex flex-col gap-[3vh]">
                          <div className="flex flex-col gap-[1.5vh]">
                            <div className="flex items-center gap-[0.75vw]">
                              <span className="text-[0.9vw] font-semibold text-gray-900 whitespace-nowrap tracking-wider">
                                Page Background
                              </span>
                              <div className="h-[0.1vw] flex-1 bg-gray-200"></div>
                            </div>

                            <div className="bg-white rounded-[0.8vw] border border-gray-200 p-[1vw] shadow-sm">
                              <div className="flex items-center justify-between mb-[1.5vh]">
                                <span className="text-[0.75vw] text-gray-500 font-medium">Background Color</span>
                                <div
                                  className="flex items-center gap-[0.5vw] cursor-pointer hover:bg-gray-50 p-[0.3vw] rounded-[0.4vw] transition-colors"
                                  onClick={() => setIsPageBgPickerOpen(!isPageBgPickerOpen)}
                                >
                                  <div className="w-[1.2vw] h-[1.2vw] rounded-full border border-gray-200 shadow-inner flex-shrink-0" style={{ background: currentBgStr }} />
                                  <span className="text-[0.7vw] font-mono text-gray-400 overflow-hidden text-ellipsis whitespace-nowrap max-w-[8vw]">
                                    {currentBgStr.toUpperCase()}
                                  </span>
                                </div>
                              </div>

                              <div className="grid grid-cols-8 gap-[0.4vw]">
                                {presetColors.map((color) => (
                                  <button
                                    key={color}
                                    onClick={() => {
                                      updateElementAttribute(activePageIndex, 'Overlay', {
                                        'fill-type': 'solid',
                                        'fill': color
                                      });
                                    }}
                                    className={`w-[1.6vw] h-[1.6vw] rounded-[0.3vw] border border-gray-100 transition-all hover:scale-110 shadow-sm ${currentBg.toLowerCase() === color.toLowerCase() ? 'ring-2 ring-blue-500 scale-110 z-10 ring-offset-1' : 'hover:z-10'}`}
                                    style={{ backgroundColor: color }}
                                    title={color}
                                  />
                                ))}
                              </div>

                              {isPageBgPickerOpen && createPortal(
                                <div
                                  className="fixed z-[5000]"
                                  style={{
                                    top: '50%',
                                    right: '19.5vw', // Left of the right sidebar
                                    transform: 'translateY(-50%)'
                                  }}
                                >
                                  <div className="animate-in fade-in zoom-in-95 duration-200 relative">
                                    <ColorPicker
                                      color={currentBgStr}
                                      onChange={(newVal) => {
                                        if (newVal.includes('gradient')) {
                                          const parsed = parseGradient(newVal);
                                          if (parsed) {
                                            updateElementAttribute(activePageIndex, 'Overlay', {
                                              'fill-type': 'gradient',
                                              'fill-gradient-type': parsed.type.toLowerCase(),
                                              'fill-stops': JSON.stringify(parsed.stops.map(s => ({
                                                color: s.color,
                                                offset: s.offset,
                                                opacity: s.opacity / 100
                                              }))),
                                              'fill-angle': (parsed.angle || 0).toString(),
                                              'fill-radius': (parsed.radius || 100).toString(),
                                              'fill': newVal
                                            });
                                          }
                                        } else {
                                          updateElementAttribute(activePageIndex, 'Overlay', {
                                            'fill-type': 'solid',
                                            'fill': newVal
                                          });
                                        }
                                      }}
                                      opacity={100}
                                      onClose={() => setIsPageBgPickerOpen(false)}
                                    />
                                  </div>
                                </div>,
                                document.body
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col gap-[1.5vh]">
                            <div className="flex items-center gap-[0.75vw]">
                              <span className="text-[0.9vw] font-semibold text-gray-900 whitespace-nowrap tracking-wider">Document info</span>
                              <div className="h-[0.1vw] flex-1 bg-gray-200"></div>
                            </div>
                            <div className="bg-white rounded-[0.8vw] border border-gray-200 p-[1vw] shadow-sm flex flex-col gap-[1vh]">
                              {(() => {
                                const info = getDocumentInfo(baseWidth, baseHeight);
                                return (
                                  <>
                                    <div className="flex justify-between items-center text-[0.75vw]">
                                      <span className="text-gray-500 font-medium">Format</span>
                                      <span className="text-gray-900 font-semibold">{info.format}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[0.75vw]">
                                      <span className="text-gray-500 font-medium">Orientation</span>
                                      <span className="text-gray-900 font-semibold">{info.orientation}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[0.75vw]">
                                      <span className="text-gray-500 font-medium">Dimensions</span>
                                      <span className="text-gray-900 font-semibold">{info.dimensions}</span>
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  )}
                </div>
              )}
            </div>
          )
        ) : activeTopTool === 'interaction' ? (
          <InteractionPanel
            selectedElementProps={selectedElementProps}
            activePageIndex={activePageIndex}
            selectedLayerId={selectedLayerId}
            updateElementAttribute={updateElementAttribute}
            deleteLayer={deleteLayer}
            pages={pages}
            flipbookDimensions={flipbookDimensions}
            onCustomizePopup={onCustomizePopup}
            setIs3DModalOpen={setIs3DModalOpen}
            setCurrent3DItem={setCurrent3DItem}
            v_id={effectiveVId}
            folderName={effectiveFolder}
            flipbookName={effectiveBook}
          />
        ) : (
          /* Animation Mode */
          <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar p-[1.5vw]">
            <AnimationPanel
              selectedElementProps={selectedElementProps}
              flipbookDimensions={flipbookDimensions}
              selectedLayerId={selectedLayerId}
              selectedElement={(() => {
                if (!selectedLayerId) return null;
                const container = document.querySelector(`.page-svg-container [id="${selectedLayerId}"]`);
                if (container) return container;
                return document.getElementById(selectedLayerId) || null;
              })()}
              onUpdate={(elementId, attr, value) => {
                if (elementId && attr) {
                  updateElementAttribute(activePageIndex, elementId, attr, value);
                }
              }}
            />
          </div>
        )}
      </div>

      {/* Import Via URL Modal */}
      <ImportViaUrlModal
        isOpen={isUrlModalOpen}
        onClose={() => setIsUrlModalOpen(false)}
        activePageIndex={activePageIndex}
      />

      <MediaGalleryPopup
        isOpen={isMediaGalleryOpen}
        onClose={() => setIsMediaGalleryOpen(false)}
        anchorRef={browseGalleryBtnRef}
        onFileSelect={(file) => {
          handleFileChange({ target: { files: [file] } });
          setIsMediaGalleryOpen(false);
        }}
      />
    </div>
  );
};

export default RightSidebar;