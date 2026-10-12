import React from 'react';
import { QrCode } from 'lucide-react';

const QRCode = ({ isFullView }) => {
  const renderQRCode = (isDrag) => {
    const uniqueId = Date.now();
    const defaultUrl = 'https://example.com';
    const defaultImg = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(defaultUrl)}&amp;size=240x240`;
    let transform = '';
    if (!isDrag) {
      transform = 'transform="translate(80, 123.5)"';
    }
    return `
      <g id="qrcode-${uniqueId}" data-type="qrcode" cursor="pointer" data-qr-url="${defaultUrl}" data-qr-frame="frame-none" data-qr-text="SCAN ME" data-qr-logo-size="22" data-qr-logo-bg="true" data-qr-logo="" ${transform}>
        <image x="0" y="0" width="50" height="50" href="${defaultImg}" preserveAspectRatio="none" />
        <rect x="0" y="0" width="50" height="50" fill="transparent" />
      </g>
    `;
  };

  return (
    <div className={`grid grid-cols-2 gap-[0.5vw] ${isFullView ? 'p-[0.5vw]' : ''}`}>
      <button
        draggable="true"
        onDragStart={(e) => {
          e.dataTransfer.setData('application/x-flipbook-element', JSON.stringify({
            type: 'qrcode',
            svgContent: renderQRCode(true)
          }));
        }}
        onClick={() => {
          window.dispatchEvent(new CustomEvent('add-element-to-editor', {
            detail: { svgContent: renderQRCode(false) }
          }));
        }}
        className="flex flex-col items-center justify-center p-[1vw] bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50/30 transition-all group"
      >
        <QrCode className="text-gray-500 group-hover:text-blue-500 transition-colors mb-[0.5vw] w-[1.5vw] h-[1.5vw]" />
        <span className="text-[0.7vw] font-medium text-gray-700 group-hover:text-blue-600 transition-colors">QR Code</span>
      </button>
    </div>
  );
};

export default QRCode;
