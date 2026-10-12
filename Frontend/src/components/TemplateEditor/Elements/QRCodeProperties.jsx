import React, { useState, useEffect, useRef } from 'react';
import { Link, Image as ImageIcon, LayoutTemplate, Square, Tag, MessageSquare, Camera, Gem, Info, UploadCloud } from 'lucide-react';

const QRCodeProperties = ({ selectedElement, onUpdate }) => {
  const [url, setUrl] = useState('https://example.com');
  const [frame, setFrame] = useState('frame-none');
  const [text, setText] = useState('SCAN ME');
  const [logoSrc, setLogoSrc] = useState(null);
  const [logoSize, setLogoSize] = useState(22);
  const [logoBg, setLogoBg] = useState(true);
  const fileInputRef = useRef(null);

  // Initialize state from selected element attributes
  useEffect(() => {
    if (selectedElement) {
      setUrl(selectedElement.getAttribute('data-qr-url') || 'https://example.com');
      setFrame(selectedElement.getAttribute('data-qr-frame') || 'frame-none');
      setText(selectedElement.getAttribute('data-qr-text') || 'SCAN ME');
      setLogoSrc(selectedElement.getAttribute('data-qr-logo') || null);
      setLogoSize(parseInt(selectedElement.getAttribute('data-qr-logo-size')) || 22);
      setLogoBg(selectedElement.getAttribute('data-qr-logo-bg') === 'true');
    }
  }, [selectedElement]);

  const updateQRImage = async (currentUrl, currentFrame, currentText, currentLogoSrc, currentLogoSize, currentLogoBg) => {
    if (!selectedElement) return;

    // Update attributes first
    selectedElement.setAttribute('data-qr-url', currentUrl);
    selectedElement.setAttribute('data-qr-frame', currentFrame);
    selectedElement.setAttribute('data-qr-text', currentText);
    selectedElement.setAttribute('data-qr-logo', currentLogoSrc || '');
    selectedElement.setAttribute('data-qr-logo-size', currentLogoSize.toString());
    selectedElement.setAttribute('data-qr-logo-bg', currentLogoBg ? 'true' : 'false');

    // Generate composite image
    const QR_SIZE = 240;
    
    // Load QR Code from API (Level H for high error correction)
    const qrImg = new Image();
    qrImg.crossOrigin = 'Anonymous';
    
    const loadImg = (src) => new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });

    try {
      const baseQrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(currentUrl || 'https://example.com')}&size=${QR_SIZE}x${QR_SIZE}&ecc=H`;
      const qrCanvasElem = await loadImg(baseQrUrl);
      
      if (!qrCanvasElem) return;

      const exportCanvas = document.createElement('canvas');
      const ctx = exportCanvas.getContext('2d');
      const scale = 2; // High-DPI

      let paddingX = 32;
      let paddingTop = 32;
      let paddingBottom = 32;
      const qrRenderSize = QR_SIZE;

      if (currentFrame === 'frame-badge') {
        paddingBottom = 75;
      } else if (currentFrame === 'frame-bubble') {
        paddingTop = 65;
      } else if (currentFrame === 'frame-polaroid') {
        paddingBottom = 75;
      } else if (currentFrame === 'frame-elegant') {
        paddingBottom = 65;
      }

      const totalWidth = qrRenderSize + (paddingX * 2);
      const totalHeight = qrRenderSize + paddingTop + paddingBottom;

      exportCanvas.width = totalWidth * scale;
      exportCanvas.height = totalHeight * scale;
      ctx.scale(scale, scale);

      // Background draw
      if (currentFrame === 'frame-bubble') {
        ctx.beginPath();
        ctx.fillStyle = '#10b981';
        ctx.roundRect(0, 0, totalWidth, totalHeight, 20);
        ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = '#ffffff';
        ctx.roundRect(paddingX - 10, paddingTop - 10, qrRenderSize + 20, qrRenderSize + 20, 12);
        ctx.fill();
      } else if (currentFrame === 'frame-elegant') {
        ctx.beginPath();
        ctx.fillStyle = '#18181b';
        ctx.roundRect(0, 0, totalWidth, totalHeight, 20);
        ctx.fill();
        ctx.beginPath();
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 3;
        ctx.roundRect(2, 2, totalWidth - 4, totalHeight - 4, 18);
        ctx.stroke();
        ctx.beginPath();
        ctx.fillStyle = '#ffffff';
        ctx.roundRect(paddingX - 8, paddingTop - 8, qrRenderSize + 16, qrRenderSize + 16, 10);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.fillStyle = '#ffffff';
        ctx.roundRect(0, 0, totalWidth, totalHeight, currentFrame === 'frame-polaroid' ? 6 : 16);
        ctx.fill();
        if (currentFrame === 'frame-badge') {
          ctx.beginPath();
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 4;
          ctx.roundRect(2, 2, totalWidth - 4, totalHeight - 4, 16);
          ctx.stroke();
        }
      }

      // Draw QR Code
      ctx.drawImage(qrCanvasElem, paddingX, paddingTop, qrRenderSize, qrRenderSize);

      // Draw Center Logo
      if (currentLogoSrc) {
        const logoImg = await loadImg(currentLogoSrc);
        if (logoImg) {
          const logoDim = Math.round((qrRenderSize * currentLogoSize) / 100);
          const logoX = paddingX + (qrRenderSize - logoDim) / 2;
          const logoY = paddingTop + (qrRenderSize - logoDim) / 2;

          if (currentLogoBg) {
            ctx.beginPath();
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(logoX - 3, logoY - 3, logoDim + 6, logoDim + 6);
          }
          ctx.drawImage(logoImg, logoX, logoY, logoDim, logoDim);
        }
      }

      // Draw Frame Labels
      const labelText = (currentText || 'SCAN ME').toUpperCase();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (currentFrame === 'frame-badge') {
        ctx.beginPath();
        ctx.fillStyle = '#3b82f6';
        ctx.roundRect(totalWidth / 2 - 60, totalHeight - 50, 120, 30, 15);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(labelText, totalWidth / 2, totalHeight - 35);
      } else if (currentFrame === 'frame-bubble') {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText(labelText, totalWidth / 2, 32);
      } else if (currentFrame === 'frame-polaroid') {
        ctx.fillStyle = '#374151';
        ctx.font = 'bold 14px monospace';
        ctx.fillText(labelText, totalWidth / 2, totalHeight - 32);
      } else if (currentFrame === 'frame-elegant') {
        ctx.fillStyle = '#fbbf24';
        ctx.font = '600 12px sans-serif';
        ctx.fillText(`★ ${labelText} ★`, totalWidth / 2, totalHeight - 32);
      }

      const dataUrl = exportCanvas.toDataURL('image/png');
      
      const imageNode = selectedElement.querySelector('image');
      let currentDisplayWidth = 50; // Default
      
      if (imageNode) {
        const existingW = parseFloat(imageNode.getAttribute('width'));
        if (!isNaN(existingW) && existingW > 0) {
          currentDisplayWidth = existingW;
        }
        
        const newDisplayHeight = currentDisplayWidth * (totalHeight / totalWidth);
        
        imageNode.setAttribute('href', dataUrl);
        // Let's set the image width/height correctly to avoid squishing while preserving physical size
        imageNode.setAttribute('width', currentDisplayWidth);
        imageNode.setAttribute('height', newDisplayHeight);
      }
      
      const rectNode = selectedElement.querySelector('rect');
      if (rectNode) {
        const existingW = parseFloat(rectNode.getAttribute('width'));
        const displayW = (!isNaN(existingW) && existingW > 0) ? existingW : currentDisplayWidth;
        const displayH = displayW * (totalHeight / totalWidth);
        rectNode.setAttribute('width', displayW);
        rectNode.setAttribute('height', displayH);
      }
      
      if (onUpdate) {
        onUpdate(selectedElement.outerHTML);
      }

    } catch (e) {
      console.error("Error generating QR composite", e);
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

    if (key === 'url') { newUrl = value; setUrl(value); }
    if (key === 'frame') { newFrame = value; setFrame(value); }
    if (key === 'text') { newText = value; setText(value); }
    if (key === 'logoSrc') { newLogoSrc = value; setLogoSrc(value); }
    if (key === 'logoSize') { newLogoSize = value; setLogoSize(value); }
    if (key === 'logoBg') { newLogoBg = value; setLogoBg(value); }

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

  // Helper polyfill for roundRect
  if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
      if (w < 2 * r) r = w / 2;
      if (h < 2 * r) r = h / 2;
      this.beginPath();
      this.moveTo(x + r, y);
      this.arcTo(x + w, y, x + w, y + h, r);
      this.arcTo(x + w, y + h, x, y + h, r);
      this.arcTo(x, y + h, x, y, r);
      this.arcTo(x, y, x + w, y, r);
      this.closePath();
      return this;
    };
  }

  const frames = [
    { id: 'frame-none', icon: Square, label: '1. Clean (No Frame)', color: 'text-slate-500' },
    { id: 'frame-badge', icon: Tag, label: '2. Bottom Badge', color: 'text-blue-500' },
    { id: 'frame-bubble', icon: MessageSquare, label: '3. Emerald Top Banner', color: 'text-emerald-500' },
    { id: 'frame-polaroid', icon: Camera, label: '4. Minimalist Polaroid', color: 'text-amber-500' },
    { id: 'frame-elegant', icon: Gem, label: '5. Dark Luxury Gold', color: 'text-yellow-500' }
  ];

  return (
    <div className="w-full flex flex-col gap-[0.8vw] font-sans text-gray-800 p-[0.5vw]">
      <div className="flex items-center gap-[0.4vw] mb-[0.2vw]">
        <h3 className="text-[0.9vw] font-semibold text-gray-900 tracking-wider">QR Code Settings</h3>
        <div className="w-[1vw] h-[1vw] rounded-full bg-gray-300 flex items-center justify-center cursor-help">
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

        {/* Center Logo */}
        <div className="space-y-[0.5vw]">
          <div className="flex items-center justify-between">
            <label className="text-[0.75vw] font-semibold text-gray-800 flex items-center gap-[0.4vw]">
              <ImageIcon size="0.8vw" className="text-blue-600" /> Center Logo
            </label>
            {logoSrc && (
              <button onClick={() => handleChange('logoSrc', null)} className="text-[0.65vw] text-rose-500 hover:text-rose-600 font-medium">Remove</button>
            )}
          </div>
          
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors rounded-[0.5vw] p-[0.8vw] text-center cursor-pointer bg-gray-50 hover:bg-blue-50/30"
          >
            <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleLogoUpload} />
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

          <div className={`space-y-[0.4vw] transition-opacity ${logoSrc ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
            <div className="flex items-center justify-between text-[0.7vw] text-gray-600">
              <span>Logo Scale</span>
              <span className="font-semibold text-gray-900">{logoSize}%</span>
            </div>
            <input 
              type="range" 
              min="14" max="28" 
              value={logoSize} 
              onChange={(e) => handleChange('logoSize', parseInt(e.target.value))}
              className="w-full h-[0.3vw] bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <label className="flex items-center gap-[0.4vw] text-[0.7vw] text-gray-600 cursor-pointer">
              <input type="checkbox" checked={logoBg} onChange={(e) => handleChange('logoBg', e.target.checked)} className="rounded text-blue-600" />
              <span>Add white backdrop behind logo</span>
            </label>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Frame Styles */}
        <div className="space-y-[0.4vw]">
          <label className="text-[0.75vw] font-semibold text-gray-800 flex items-center gap-[0.4vw]">
            <LayoutTemplate size="0.8vw" className="text-blue-600" /> Choose Frame Style
          </label>
          
          <div className="grid grid-cols-1 gap-[0.3vw]">
            {frames.map((f) => (
              <button 
                key={f.id}
                onClick={() => handleChange('frame', f.id)}
                className={`w-full flex items-center px-[0.6vw] py-[0.4vw] rounded-[0.4vw] border text-[0.75vw] font-medium transition text-left ${frame === f.id ? 'border-blue-600 bg-blue-50/50 text-blue-900' : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}
              >
                <f.icon size="0.8vw" className={`${f.color} mr-[0.4vw]`} /> 
                {f.label}
              </button>
            ))}
          </div>

          {frame !== 'frame-none' && (
            <div className="pt-[0.4vw] space-y-[0.2vw]">
              <label className="text-[0.65vw] font-medium text-gray-600">Frame CTA Text</label>
              <input 
                type="text" 
                value={text} 
                onChange={(e) => handleChange('text', e.target.value)}
                maxLength="20"
                className="w-full px-[0.5vw] py-[0.3vw] bg-gray-50 border border-gray-300 rounded-[0.3vw] text-[0.75vw] focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRCodeProperties;
