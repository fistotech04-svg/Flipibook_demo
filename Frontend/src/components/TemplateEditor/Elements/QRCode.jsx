import React, { useEffect } from 'react';
import { QR_FRAMES, getCachedFrame, renderQRWithFrame, preloadDefaultFrames } from './qrFrameRenderer';

// Mini QR Code matrix path icon for thumbnails
const MiniQRMatrix = ({ x = 12, y = 12, size = 36 }) => {
  const scale = size / 36;
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      {/* Top Left Finder */}
      <rect x="0" y="0" width="11" height="11" fill="none" stroke="#000" strokeWidth="2.5" />
      <rect x="3" y="3" width="5" height="5" fill="#000" />
      {/* Top Right Finder */}
      <rect x="25" y="0" width="11" height="11" fill="none" stroke="#000" strokeWidth="2.5" />
      <rect x="28" y="3" width="5" height="5" fill="#000" />
      {/* Bottom Left Finder */}
      <rect x="0" y="25" width="11" height="11" fill="none" stroke="#000" strokeWidth="2.5" />
      <rect x="3" y="28" width="5" height="5" fill="#000" />
      {/* Module Dots */}
      <rect x="14" y="2" width="3" height="3" fill="#000" />
      <rect x="19" y="5" width="3" height="3" fill="#000" />
      <rect x="14" y="10" width="3" height="3" fill="#000" />
      <rect x="2" y="14" width="3" height="3" fill="#000" />
      <rect x="7" y="19" width="3" height="3" fill="#000" />
      <rect x="14" y="15" width="3" height="3" fill="#000" />
      <rect x="19" y="15" width="3" height="3" fill="#000" />
      <rect x="14" y="22" width="3" height="3" fill="#000" />
      <rect x="19" y="25" width="3" height="3" fill="#000" />
      <rect x="26" y="14" width="3" height="3" fill="#000" />
      <rect x="31" y="19" width="3" height="3" fill="#000" />
      <rect x="25" y="25" width="3" height="3" fill="#000" />
      <rect x="31" y="28" width="3" height="3" fill="#000" />
    </g>
  );
};

// Mini Frame Vector Thumbnails matching user design exactly
export const FrameThumbnail = ({ frameId }) => {
  switch (frameId) {
    case 'frame-bottom-bar':
      return (
        <svg viewBox="0 0 60 72" className="w-full h-full p-[0.3vw]">
          <rect x="3" y="3" width="54" height="66" rx="4" fill="#ffffff" stroke="#000000" strokeWidth="2.8" />
          <MiniQRMatrix x="12" y="9" size="36" />
          <path d="M 3 51 L 57 51 L 57 65 A 4 4 0 0 1 53 69 L 7 69 A 4 4 0 0 1 3 65 Z" fill="#000000" />
          <text x="30" y="61.5" fill="#ffffff" fontSize="5.2" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">SCAN ME</text>
        </svg>
      );
    case 'frame-top-bubble':
      return (
        <svg viewBox="0 0 60 72" className="w-full h-full p-[0.3vw]">
          <rect x="14" y="2" width="32" height="9" rx="2.5" fill="#000000" />
          <polygon points="26,11 30,15 34,11" fill="#000000" />
          <text x="30" y="8" fill="#ffffff" fontSize="4.2" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">SCAN ME</text>
          <rect x="5" y="14" width="50" height="53" rx="4" fill="#ffffff" stroke="#000000" strokeWidth="2.8" />
          <MiniQRMatrix x="12" y="21" size="36" />
        </svg>
      );
    case 'frame-curved-arrow':
      return (
        <svg viewBox="0 0 60 70" className="w-full h-full p-[0.3vw]">
          <MiniQRMatrix x="17" y="5" size="37" />
          <path d="M 12 54 Q 3 34 13 18" fill="none" stroke="#000000" strokeWidth="2" strokeLinecap="round" />
          <polygon points="17,16 11,13 12,20" fill="#000000" />
          <text x="24" y="63" fill="#000000" fontSize="7.5" fontWeight="bold" fontFamily="'Caveat', cursive, sans-serif" textAnchor="middle">Scan me</text>
        </svg>
      );
    case 'frame-phone':
      return (
        <svg viewBox="0 0 60 78" className="w-full h-full p-[0.3vw]">
          <rect x="8" y="2" width="44" height="74" rx="6" fill="#000000" />
          <rect x="24" y="5" width="12" height="1.8" rx="0.9" fill="#e2e8f0" />
          <circle cx="20" cy="5.9" r="0.9" fill="#64748b" />
          <rect x="12" y="9" width="36" height="54" rx="3" fill="#ffffff" />
          <MiniQRMatrix x="15" y="17" size="30" />
          <text x="30" y="70" fill="#ffffff" fontSize="4.8" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">SCAN ME</text>
        </svg>
      );
    case 'frame-bottom-pointer':
      return (
        <svg viewBox="0 0 60 72" className="w-full h-full p-[0.3vw]">
          <rect x="5" y="4" width="50" height="51" rx="4" fill="#ffffff" stroke="#000000" strokeWidth="2.8" />
          <MiniQRMatrix x="12" y="11" size="36" />
          <polygon points="26,57 30,53 34,57" fill="#000000" />
          <rect x="13" y="57" width="34" height="9.5" rx="2" fill="#000000" />
          <text x="30" y="63.5" fill="#ffffff" fontSize="4.2" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">SCAN ME</text>
        </svg>
      );
    case 'frame-simple-text':
      return (
        <svg viewBox="0 0 60 70" className="w-full h-full p-[0.3vw]">
          <rect x="5" y="4" width="50" height="51" rx="4" fill="#ffffff" stroke="#000000" strokeWidth="2.8" />
          <MiniQRMatrix x="12" y="11" size="36" />
          <text x="30" y="64" fill="#000000" fontSize="5.5" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">SCAN ME</text>
        </svg>
      );
    case 'frame-top-header':
      return (
        <svg viewBox="0 0 60 72" className="w-full h-full p-[0.3vw]">
          <rect x="3" y="3" width="54" height="66" rx="4" fill="#ffffff" stroke="#000000" strokeWidth="2.8" />
          <path d="M 3 7 A 4 4 0 0 1 7 3 L 53 3 A 4 4 0 0 1 57 7 L 57 17 L 3 17 Z" fill="#000000" />
          <text x="30" y="12.5" fill="#ffffff" fontSize="5.2" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">SCAN ME</text>
          <MiniQRMatrix x="12" y="24" size="36" />
        </svg>
      );
    case 'frame-none':
    default:
      return (
        <svg viewBox="0 0 60 60" className="w-full h-full p-[0.3vw]">
          <rect x="2" y="2" width="56" height="56" rx="3" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
          <MiniQRMatrix x="12" y="12" size="36" />
        </svg>
      );
  }
};

const QRCode = ({ isFullView }) => {
  useEffect(() => {
    preloadDefaultFrames();
  }, []);

  const renderQRCode = (isDrag, frameId = 'frame-bottom-bar', defaultText = 'SCAN ME') => {
    const uniqueId = Date.now();
    const defaultUrl = 'https://example.com';
    const cached = getCachedFrame(frameId, defaultUrl);
    const imgHref = cached.dataUrl;
    const width = 50;
    const height = Math.round(width * (QR_FRAMES.find(f => f.id === frameId)?.ratio || 1));
    let transform = '';
    if (!isDrag) {
      transform = 'transform="translate(80, 123.5)"';
    }
    return `
      <g id="qrcode-${uniqueId}" data-type="qrcode" cursor="pointer" data-qr-url="${defaultUrl}" data-qr-frame="${frameId}" data-qr-text="${defaultText}" data-qr-logo-size="22" data-qr-logo-bg="true" data-qr-logo="" data-qr-text-color="#FFFFFF" data-qr-frame-bg="#FFFFFF" data-qr-arrow-color="#000000" data-qr-font-family="Poppins" data-qr-font-size="24" data-qr-font-weight="Semi Bold" ${transform}>
        <image x="0" y="0" width="${width}" height="${height}" href="${imgHref}" xlink:href="${imgHref}" preserveAspectRatio="none" />
        <rect x="0" y="0" width="${width}" height="${height}" fill="transparent" />
      </g>
    `;
  };

  const handleAddFrame = async (frame) => {
    let content = renderQRCode(false, frame.id, frame.defaultText);
    try {
      const rendered = await renderQRWithFrame({
        url: 'https://example.com',
        frame: frame.id,
        text: frame.defaultText,
        textColor: '#FFFFFF',
        frameBgColor: '#FFFFFF',
        arrowColor: '#000000',
        fontFamily: 'Poppins',
        fontSize: 24,
        fontWeight: 'Semi Bold'
      });
      if (rendered && rendered.dataUrl) {
        const uniqueId = Date.now();
        const width = 50;
        const height = Math.round(width * (rendered.totalHeight / rendered.totalWidth));
        content = `
          <g id="qrcode-${uniqueId}" data-type="qrcode" cursor="pointer" data-qr-url="https://example.com" data-qr-frame="${frame.id}" data-qr-text="${frame.defaultText}" data-qr-logo-size="22" data-qr-logo-bg="true" data-qr-logo="" data-qr-text-color="#FFFFFF" data-qr-frame-bg="#FFFFFF" data-qr-arrow-color="#000000" data-qr-font-family="Poppins" data-qr-font-size="24" data-qr-font-weight="Semi Bold" transform="translate(80, 123.5)">
            <image x="0" y="0" width="${width}" height="${height}" href="${rendered.dataUrl}" xlink:href="${rendered.dataUrl}" preserveAspectRatio="none" />
            <rect x="0" y="0" width="${width}" height="${height}" fill="transparent" />
          </g>
        `;
      }
    } catch (e) {
      console.warn('Fallback to standard template', e);
    }

    window.dispatchEvent(
      new CustomEvent('add-element-to-editor', {
        detail: { svgContent: content }
      })
    );
  };

  // When not in full view (main Elements list), show the first 4 frame styles
  const displayFrames = isFullView ? QR_FRAMES : QR_FRAMES.slice(0, 4);

  return (
    <div className={`grid grid-cols-2 gap-[0.6vw] ${isFullView ? 'p-[0.5vw]' : ''}`}>
      {displayFrames.map((frame) => (
        <button
          key={frame.id}
          draggable="true"
          title={`Click or drag to add ${frame.shortName}`}
          onDragStart={(e) => {
            e.dataTransfer.setData(
              'application/x-flipbook-element',
              JSON.stringify({
                type: 'qrcode',
                svgContent: renderQRCode(true, frame.id, frame.defaultText)
              })
            );
          }}
          onClick={() => handleAddFrame(frame)}
          className="flex flex-col items-center justify-between p-[0.6vw] bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50/20 hover:shadow-xs transition-all group cursor-pointer"
        >
          <div className="w-[4.2vw] h-[4.8vw] flex items-center justify-center my-[0.2vw] group-hover:scale-105 transition-transform">
            <FrameThumbnail frameId={frame.id} />
          </div>
          <span className="text-[0.68vw] font-medium text-gray-700 group-hover:text-blue-600 transition-colors text-center truncate w-full mt-[0.2vw]">
            {frame.shortName}
          </span>
        </button>
      ))}
    </div>
  );
};

export default QRCode;
