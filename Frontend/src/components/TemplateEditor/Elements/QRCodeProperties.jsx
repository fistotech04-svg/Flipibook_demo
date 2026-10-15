import React, { useState, useEffect, useRef } from 'react';
import {
  Link,
  Image as ImageIcon,
  LayoutTemplate,
  MessageSquare,
  ArrowUpRight,
  Smartphone,
  Tag,
  Type,
  CreditCard,
  Square,
  Info,
  UploadCloud
} from 'lucide-react';
import { renderQRWithFrame, QR_FRAMES } from './qrFrameRenderer';

const FRAME_ICONS = {
  'frame-bottom-bar': LayoutTemplate,
  'frame-top-bubble': MessageSquare,
  'frame-curved-arrow': ArrowUpRight,
  'frame-phone': Smartphone,
  'frame-bottom-pointer': Tag,
  'frame-simple-text': Type,
  'frame-top-header': CreditCard,
  'frame-none': Square
};

const QRCodeProperties = ({ selectedElement, onUpdate }) => {
  const [url, setUrl] = useState('https://example.com');
  const [frame, setFrame] = useState('frame-bottom-bar');
  const [text, setText] = useState('SCAN ME');
  const [logoSrc, setLogoSrc] = useState(null);
  const [logoSize, setLogoSize] = useState(22);
  const [logoBg, setLogoBg] = useState(true);
  const fileInputRef = useRef(null);

  // Initialize state from selected element attributes
  useEffect(() => {
    if (selectedElement) {
      setUrl(selectedElement.getAttribute('data-qr-url') || 'https://example.com');
      const currentFrame = selectedElement.getAttribute('data-qr-frame') || 'frame-bottom-bar';
      setFrame(currentFrame);
      setText(selectedElement.getAttribute('data-qr-text') || (currentFrame === 'frame-curved-arrow' ? 'Scan me' : 'SCAN ME'));
      setLogoSrc(selectedElement.getAttribute('data-qr-logo') || null);
      setLogoSize(parseInt(selectedElement.getAttribute('data-qr-logo-size')) || 22);
      setLogoBg(selectedElement.getAttribute('data-qr-logo-bg') === 'true');
    }
  }, [selectedElement]);

  const updateQRImage = async (currentUrl, currentFrame, currentText, currentLogoSrc, currentLogoSize, currentLogoBg) => {
    if (!selectedElement) return;

    // Update element DOM attributes
    selectedElement.setAttribute('data-qr-url', currentUrl);
    selectedElement.setAttribute('data-qr-frame', currentFrame);
    selectedElement.setAttribute('data-qr-text', currentText);
    selectedElement.setAttribute('data-qr-logo', currentLogoSrc || '');
    selectedElement.setAttribute('data-qr-logo-size', currentLogoSize.toString());
    selectedElement.setAttribute('data-qr-logo-bg', currentLogoBg ? 'true' : 'false');

    try {
      const { dataUrl, totalWidth, totalHeight } = await renderQRWithFrame({
        url: currentUrl,
        frame: currentFrame,
        text: currentText,
        logoSrc: currentLogoSrc,
        logoSize: currentLogoSize,
        logoBg: currentLogoBg
      });

      const imageNode = selectedElement.querySelector('image');
      let currentDisplayWidth = 50;

      if (imageNode) {
        const existingW = parseFloat(imageNode.getAttribute('width'));
        if (!isNaN(existingW) && existingW > 0) {
          currentDisplayWidth = existingW;
        }

        const newDisplayHeight = currentDisplayWidth * (totalHeight / totalWidth);

        imageNode.setAttribute('href', dataUrl);
        imageNode.setAttribute('width', currentDisplayWidth.toString());
        imageNode.setAttribute('height', newDisplayHeight.toString());
      }

      const rectNode = selectedElement.querySelector('rect');
      if (rectNode) {
        const existingW = parseFloat(rectNode.getAttribute('width'));
        const displayW = (!isNaN(existingW) && existingW > 0) ? existingW : currentDisplayWidth;
        const displayH = displayW * (totalHeight / totalWidth);
        rectNode.setAttribute('width', displayW.toString());
        rectNode.setAttribute('height', displayH.toString());
      }

      if (onUpdate) {
        onUpdate(selectedElement.outerHTML);
      }
    } catch (e) {
      console.error('Error generating QR composite with frame:', e);
      if (onUpdate) onUpdate(selectedElement.outerHTML);
    }
  };

  const handleChange = (key, value) => {
    let newUrl = url;
    let newFrame = frame;
    let newText = text;
    let newLogoSrc = logoSrc;
    let newLogoSize = logoSize;
    let newLogoBg = logoBg;

    if (key === 'url') {
      newUrl = value;
      setUrl(value);
    }
    if (key === 'frame') {
      newFrame = value;
      setFrame(value);
      // Auto-adapt text for curved arrow script font
      if (value === 'frame-curved-arrow' && (!newText || newText === 'SCAN ME')) {
        newText = 'Scan me';
        setText('Scan me');
      } else if (value !== 'frame-curved-arrow' && newText === 'Scan me') {
        newText = 'SCAN ME';
        setText('SCAN ME');
      }
    }
    if (key === 'text') {
      newText = value;
      setText(value);
    }
    if (key === 'logoSrc') {
      newLogoSrc = value;
      setLogoSrc(value);
    }
    if (key === 'logoSize') {
      newLogoSize = value;
      setLogoSize(value);
    }
    if (key === 'logoBg') {
      newLogoBg = value;
      setLogoBg(value);
    }

    updateQRImage(newUrl, newFrame, newText, newLogoSrc, newLogoSize, newLogoBg);
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      handleChange('logoSrc', event.target.result);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="w-full flex flex-col gap-[0.8vw] font-sans text-gray-800 p-[0.5vw]">
      <div className="flex items-center gap-[0.4vw] mb-[0.2vw]">
        <h3 className="text-[0.9vw] font-semibold text-gray-900 tracking-wider">QR Code Settings</h3>
        <div className="w-[1vw] h-[1vw] rounded-full bg-gray-300 flex items-center justify-center cursor-help" title="Configure QR link, choose frames, and add center brand logos">
          <Info size="0.6vw" className="text-white" />
        </div>
      </div>

      <div className="flex flex-col gap-[1vw]">
        {/* URL Input */}
        <div className="space-y-[0.3vw]">
          <label className="text-[0.75vw] font-semibold text-gray-800 flex items-center gap-[0.4vw]">
            <Link size="0.8vw" className="text-blue-600" /> Destination URL
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => handleChange('url', e.target.value)}
            placeholder="https://yourwebsite.com"
            className="w-full px-[0.6vw] py-[0.4vw] bg-gray-50 border border-gray-300 rounded-[0.4vw] text-[0.8vw] focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <hr className="border-gray-100" />

        {/* Frame Styles */}
        <div className="space-y-[0.4vw]">
          <label className="text-[0.75vw] font-semibold text-gray-800 flex items-center justify-between">
            <span className="flex items-center gap-[0.4vw]">
              <LayoutTemplate size="0.8vw" className="text-blue-600" /> Frame Style
            </span>
            <span className="text-[0.65vw] text-gray-500 font-normal">7 Styles</span>
          </label>

          <div className="grid grid-cols-2 gap-[0.35vw]">
            {QR_FRAMES.map((f) => {
              const IconComp = FRAME_ICONS[f.id] || Square;
              const isSelected = frame === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => handleChange('frame', f.id)}
                  title={f.description}
                  className={`flex items-center gap-[0.4vw] px-[0.5vw] py-[0.45vw] rounded-[0.4vw] border text-[0.72vw] font-medium transition text-left ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/70 text-blue-900 shadow-xs'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <IconComp
                    size="0.85vw"
                    className={`shrink-0 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`}
                  />
                  <span className="truncate">{f.shortName}</span>
                </button>
              );
            })}
          </div>

          {frame !== 'frame-none' && (
            <div className="pt-[0.3vw] space-y-[0.2vw]">
              <label className="text-[0.68vw] font-medium text-gray-600">
                Frame Call-to-Action (CTA) Text
              </label>
              <input
                type="text"
                value={text}
                onChange={(e) => handleChange('text', e.target.value)}
                maxLength={24}
                placeholder="SCAN ME"
                className="w-full px-[0.5vw] py-[0.35vw] bg-gray-50 border border-gray-300 rounded-[0.3vw] text-[0.75vw] focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              />
            </div>
          )}
        </div>

        <hr className="border-gray-100" />

        {/* Center Logo */}
        <div className="space-y-[0.5vw]">
          <div className="flex items-center justify-between">
            <label className="text-[0.75vw] font-semibold text-gray-800 flex items-center gap-[0.4vw]">
              <ImageIcon size="0.8vw" className="text-blue-600" /> Center Logo
            </label>
            {logoSrc && (
              <button
                onClick={() => handleChange('logoSrc', null)}
                className="text-[0.65vw] text-rose-500 hover:text-rose-600 font-medium cursor-pointer"
              >
                Remove
              </button>
            )}
          </div>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors rounded-[0.5vw] p-[0.7vw] text-center cursor-pointer bg-gray-50 hover:bg-blue-50/30"
          >
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleLogoUpload}
            />
            {logoSrc ? (
              <div className="flex justify-center">
                <img src={logoSrc} alt="Logo preview" className="h-[2vw] object-contain" />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-[0.2vw] pointer-events-none">
                <UploadCloud size="1.2vw" className="text-gray-400" />
                <span className="text-[0.7vw] font-medium text-gray-600">Upload center logo</span>
              </div>
            )}
          </div>

          <div
            className={`space-y-[0.4vw] transition-opacity ${
              logoSrc ? 'opacity-100' : 'opacity-40 pointer-events-none'
            }`}
          >
            <div className="flex items-center justify-between text-[0.7vw] text-gray-600">
              <span>Logo Scale</span>
              <span className="font-semibold text-gray-900">{logoSize}%</span>
            </div>
            <input
              type="range"
              min="14"
              max="28"
              value={logoSize}
              onChange={(e) => handleChange('logoSize', parseInt(e.target.value))}
              className="w-full h-[0.3vw] bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <label className="flex items-center gap-[0.4vw] text-[0.7vw] text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={logoBg}
                onChange={(e) => handleChange('logoBg', e.target.checked)}
                className="rounded text-blue-600"
              />
              <span>Add white backdrop behind logo</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeProperties;
