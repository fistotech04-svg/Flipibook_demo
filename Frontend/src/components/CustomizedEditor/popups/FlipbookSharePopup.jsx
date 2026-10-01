import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@iconify/react';
import QRCode from 'react-qr-code';

const FlipbookSharePopup = ({ onClose, bookName = "Flipbook Name", url = "https://flipbook/page", popupSettings, isMobile = false, isLandscape = false, isPublished = true }) => {
    const [shareCurrentPage, setShareCurrentPage] = useState(false);
    const [localUrl, setLocalUrl] = useState(url);
    const [copied, setCopied] = useState(false);

    // Download states
    const [downloadFormat, setDownloadFormat] = useState('JPG');
    const [showDownloadDropdown, setShowDownloadDropdown] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const qrRef = useRef(null);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDownloadDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleDownloadQR = async () => {
        if (!qrRef.current || isDownloading) return;
        
        const svg = qrRef.current.querySelector('svg');
        if (!svg) return;

        setIsDownloading(true);
        try {
            const svgData = new XMLSerializer().serializeToString(svg);
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const svgUrl = URL.createObjectURL(svgBlob);

            const img = new Image();
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = svgUrl;
            });

            const canvas = document.createElement('canvas');
            canvas.width = 1024;
            canvas.height = 1024;
            const ctx = canvas.getContext('2d');

            if (downloadFormat === 'JPG') {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            const formatMap = {
                'JPG': 'image/jpeg',
                'PNG': 'image/png',
                'WebP': 'image/webp'
            };
            const mimeType = formatMap[downloadFormat] || 'image/jpeg';
            const dataUrl = canvas.toDataURL(mimeType, 1.0);

            const downloadLink = document.createElement('a');
            downloadLink.href = dataUrl;
            downloadLink.download = `${bookName || 'flipbook'}_QR.${downloadFormat.toLowerCase()}`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            URL.revokeObjectURL(svgUrl);
            setShowDownloadDropdown(false);
        } catch (error) {
            console.error('QR download error:', error);
        } finally {
            setIsDownloading(false);
        }
    };

    const shareModel = (platform) => {
        const shareUrl = localUrl || "https://flipbook/page";
        const text = encodeURIComponent(`Check out this flipbook: ${bookName}`);
        const encodedUrl = encodeURIComponent(shareUrl);
        
        let shareLink = '';
        switch (platform) {
            case 'facebook':
                shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
                break;
            case 'whatsapp':
                shareLink = `https://api.whatsapp.com/send?text=${text}%20${encodedUrl}`;
                break;
            case 'twitter':
                shareLink = `https://twitter.com/intent/tweet?text=${text}&url=${encodedUrl}`;
                break;
            case 'gmail':
                shareLink = `mailto:?subject=${text}&body=${encodedUrl}`;
                break;
            case 'linkedin':
                shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
                break;
            case 'instagram':
                navigator.clipboard.writeText(shareUrl);
                alert("Link copied! You can now paste it in Instagram.");
                return;
        }
        
        if (shareLink) {
            window.open(shareLink, '_blank', 'width=600,height=400');
        }
    };


    const containerStyle = {
        backgroundColor: popupSettings?.backgroundColor?.fill || '#ffffff',
        border: popupSettings?.backgroundColor?.stroke && popupSettings.backgroundColor.stroke !== '#' ? `1px solid ${popupSettings.backgroundColor.stroke}` : '1px solid #e5e7eb',
        fontFamily: popupSettings?.textProperties?.font || 'Poppins'
    };

    const headerTextStyle = {
        color: popupSettings?.textProperties?.fill || '#111827',
        fontFamily: popupSettings?.textProperties?.font || 'Poppins'
    };

    return (
        <div
            className={`absolute top-0 left-0 w-full h-full z-[5000] flex items-center justify-center pointer-events-auto bg-transparent overflow-hidden ${isMobile ? 'p-3' : ''}`}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }}
            onClick={onClose}
        >
            <div
                className={`
                    ${isMobile
                        ? (isLandscape ? 'w-[350px] p-2.5 rounded-xl gap-1.5' : 'w-[95%] max-w-[380px] p-4 gap-3.5 rounded-2xl')
                        : 'w-[24vw] p-[1.2vw] gap-[1vw] rounded-[1vw]'
                    } 
                    bg-white shadow-[0_1.5vw_4vw_rgba(0,0,0,0.12)] flex flex-col pointer-events-auto animate-in zoom-in-95 duration-200 overflow-hidden
                `}
                style={containerStyle}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className={`relative ${isMobile ? (isLandscape ? 'mb-0' : 'mb-0.5') : 'mb-[0.2vw]'}`}>
                    <div className="flex items-center gap-2.5">
                        <h2 className={`${isMobile ? (isLandscape ? 'text-[13px]' : 'text-[16px]') : 'text-[1.1vw]'} font-semibold whitespace-nowrap`} style={headerTextStyle}>Share Flipbook</h2>
                        <div className="h-[1px] flex-1 opacity-20" style={{ backgroundColor: headerTextStyle.color }}></div>
                        <button
                            onClick={onClose}
                            className={`${isMobile ? (isLandscape ? 'w-5 h-5 rounded-md' : 'w-7 h-7 rounded-lg') : 'w-[1.6vw] h-[1.6vw] rounded-[0.3vw]'} border border-[#FF4D4D] flex items-center justify-center text-[#FF4D4D] hover:bg-red-50 transition-colors`}
                        >
                            <Icon icon="lucide:x" className={isMobile ? (isLandscape ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5') : 'w-[1vw] h-[1vw]'} />
                        </button>
                    </div>
                </div>

                {/* Link Input Section */}
                <div className="flex flex-col gap-1.5 w-full">
                    <div className="flex items-center gap-2">
                        <h3 className={`${isMobile ? (isLandscape ? 'text-[11px]' : 'text-[12px]') : 'text-[1vw]'} font-semibold text-gray-700 whitespace-nowrap`}>Flipbook Link</h3>
                        <div className="flex-1 h-[1px] bg-gray-100" />
                    </div>
                    <div className={`flex items-center w-full ${isLandscape ? 'gap-1.5' : 'gap-2'}`}>
                        <div className={`flex-1 flex items-center gap-1.5 border border-gray-300 rounded-lg bg-white shadow-sm overflow-hidden focus-within:border-black transition-colors ${isMobile ? (isLandscape ? 'h-7 px-2' : 'h-9 px-3') : 'h-[2.5vw] px-[0.8vw]'}`}>
                            <Icon icon="lucide:link" className={`shrink-0 ${isMobile ? (isLandscape ? 'w-3 h-3' : 'w-3.5 h-3.5') : 'w-[0.9vw] h-[0.9vw]'} text-gray-400`} />
                            <input
                                type="text"
                                value={isPublished ? localUrl : 'Publish flipbook to enable link sharing'}
                                readOnly
                                className={`flex-1 min-w-0 h-full bg-transparent outline-none truncate font-medium ${isMobile ? (isLandscape ? 'text-[10px]' : 'text-[12px]') : 'text-[0.8vw]'} ${isPublished ? 'text-gray-600' : 'text-amber-600 italic'}`}
                            />
                        </div>
                        <button
                            disabled={!isPublished}
                            className={`flex items-center gap-1 transition-all shadow-sm ${isMobile ? (isLandscape ? 'h-7 px-2' : 'h-9 px-2.5') : 'h-[2.5vw] px-[1.2vw]'} rounded-lg ${!isPublished
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60 shadow-none'
                                    : copied
                                        ? 'bg-green-500 text-white cursor-pointer active:scale-95'
                                        : 'bg-[#4A3AFF] text-white hover:bg-blue-700 cursor-pointer active:scale-95'
                                }`}
                            onClick={() => {
                                if (!isPublished) {
                                    alert("Please publish your flipbook first to copy or share the link.");
                                    return;
                                }
                                navigator.clipboard.writeText(localUrl);
                                setCopied(true);
                                setTimeout(() => setCopied(false), 2000);
                            }}
                            title={!isPublished ? "Please publish your flipbook first to copy link" : "Copy link"}
                        >
                            <Icon icon={copied ? "lucide:check" : "lucide:copy"} className={isMobile ? (isLandscape ? 'w-3 h-3' : 'w-3.5 h-3.5') : 'w-[1.2vw] h-[1.2vw]'} />
                            <span className={`${isMobile ? (isLandscape ? 'text-[10px]' : 'text-[11px]') : 'text-[0.8vw]'} font-semibold`}>{copied ? 'Copied' : 'Copy'}</span>
                        </button>
                    </div>
                    {!isPublished && (
                        <p className={`text-amber-600 font-medium ${isMobile ? (isLandscape ? 'text-[9px]' : 'text-[10px]') : 'text-[0.65vw]'}`}>
                            * Flipbook is currently unpublished. Click "Publish" in top bar to enable link sharing.
                        </p>
                    )}
                </div>

                {/* QR Code Section */}
                <div className="flex flex-col gap-1.5 w-full">
                    <div className="flex items-center gap-2">
                        <h3 className={`${isMobile ? (isLandscape ? 'text-[11px]' : 'text-[12px]') : 'text-[1vw]'} font-semibold text-gray-700 whitespace-nowrap`}>Share QR</h3>
                        <div className="flex-1 h-[1px] bg-gray-100" />
                    </div>
                    <div className={`flex items-center ${isLandscape ? 'gap-2.5' : 'gap-4'}`}>
                        <div className={`${isMobile ? (isLandscape ? 'p-0.5 w-[50px]' : 'p-1.5 w-[72px]') : 'p-[0.6vw] w-[8vw]'} flex flex-col items-center gap-0.5 border border-gray-100 rounded-lg shadow-sm bg-white shrink-0`}>
                            <div ref={qrRef} className={`${isMobile ? (isLandscape ? 'w-8 h-8' : 'w-14 h-14') : 'w-[6.5vw] h-[6.5vw]'} flex items-center justify-center`}>
                                <QRCode
                                    size={256}
                                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                    value={localUrl}
                                    viewBox={`0 0 256 256`}
                                />
                            </div>
                        </div>
                        <div className="relative flex items-center bg-white border border-gray-200 rounded-lg shadow-sm h-9 flex-1 max-w-[140px]" ref={dropdownRef}>
                            <button
                                onClick={handleDownloadQR}
                                disabled={isDownloading}
                                className={`flex-1 px-2 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors h-full whitespace-nowrap rounded-l-lg ${isDownloading ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'}`}
                            >
                                {isDownloading ? (
                                    <Icon icon="lucide:loader-2" className="animate-spin text-[#4A3AFF] w-3.5 h-3.5 shrink-0" />
                                ) : (
                                    <Icon icon="lucide:download" className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                )}
                                <span className="truncate">{isDownloading ? 'Generating...' : `Download ${downloadFormat}`}</span>
                            </button>
                            <div className="w-[1px] h-5 bg-gray-200 shrink-0" />
                            <button
                                onClick={() => !isDownloading && setShowDownloadDropdown(!showDownloadDropdown)}
                                disabled={isDownloading}
                                className={`px-2 h-full transition-colors flex items-center justify-center shrink-0 rounded-r-lg ${isDownloading ? 'bg-gray-50 cursor-not-allowed opacity-50' : (showDownloadDropdown ? 'bg-gray-100' : 'hover:bg-gray-50')}`}
                            >
                                <Icon icon="lucide:chevron-down" className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showDownloadDropdown ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Dropdown Menu */}
                            {showDownloadDropdown && (
                                <>
                                    <div className="fixed inset-0 z-40 cursor-default" onClick={() => setShowDownloadDropdown(false)} />
                                    <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white border border-gray-100 rounded-lg shadow-xl z-50 py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                                        {['JPG', 'PNG', 'WebP'].map((format) => (
                                            <button
                                                key={format}
                                                onClick={() => {
                                                    setDownloadFormat(format);
                                                    setShowDownloadDropdown(false);
                                                }}
                                                className={`w-full text-left px-3 py-2 text-[11px] font-bold transition-all hover:bg-gray-50 flex items-center justify-between cursor-pointer ${downloadFormat === format ? 'text-[#4A3AFF]' : 'text-gray-600'}`}
                                            >
                                                {format}
                                                {downloadFormat === format && <Icon icon="lucide:check" className="w-3.5 h-3.5" />}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className={`h-[1px] w-full bg-gray-100 ${isLandscape ? 'hidden' : ''}`}></div>

                {/* Social Share */}
                <div className={`${isMobile ? (isLandscape ? 'space-y-0.5' : 'space-y-2.5') : 'space-y-[0.8vw]'}`}>
                    <div className="flex items-center gap-2">
                        <h3 className={`${isMobile ? (isLandscape ? 'text-[11px]' : 'text-[12px]') : 'text-[1vw]'} font-semibold text-gray-700 whitespace-nowrap`}>Share Through</h3>
                        <div className="flex-1 h-[1px] bg-gray-100" />
                    </div>
                    <div className="flex gap-2 justify-start flex-wrap">
                        {/* Embed Option */}
                        <button
                            className={`${isMobile ? (isLandscape ? 'w-7 h-7 rounded-md' : 'w-9 h-9 rounded-xl') : 'w-[3.2vw] h-[3.2vw] rounded-[0.6vw]'} flex items-center justify-center border border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-all shadow-sm`}
                            title="Embed"
                        >
                            <Icon icon="lucide:code-2" className={`${isMobile ? (isLandscape ? 'w-3.5 h-3.5' : 'w-4 h-4') : 'w-[2vw] h-[2vw]'} text-gray-600`} />
                        </button>
                        {[
                            { id: 'facebook', icon: 'ri:facebook-fill', color: '#1877F2' },
                            { id: 'whatsapp', icon: 'ic:baseline-whatsapp', color: '#25D366' },
                            { id: 'twitter', icon: 'ri:twitter-x-fill', color: '#000000' },
                            { id: 'gmail', icon: 'logos:google-gmail', color: '#ffffff', hasBorder: true },
                            { id: 'linkedin', icon: 'ri:linkedin-fill', color: '#0A66C2' },
                            { id: 'instagram', icon: 'skill-icons:instagram', color: '#ffffff' }
                        ].map((social) => (
                            <button
                                key={social.id}
                                onClick={() => shareModel(social.id)}
                                className={`${isMobile ? (isLandscape ? 'w-7 h-7 rounded-md' : 'w-9 h-9 rounded-xl') : 'w-[3.2vw] h-[3.2vw] rounded-[0.6vw]'} flex items-center justify-center hover:scale-110 transition-transform shadow-sm ${social.hasBorder ? 'border border-gray-100' : ''}`}
                                style={{ backgroundColor: social.color }}
                            >
                                <Icon
                                    icon={social.icon}
                                    className={`${isMobile ? (isLandscape ? 'w-3.5 h-3.5' : 'w-5 h-5') : 'w-[2vw] h-[2vw]'}`}
                                    style={{ color: social.id === 'twitter' || social.id === 'whatsapp' || social.id === 'linkedin' || social.id === 'facebook' ? 'white' : undefined }}
                                />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FlipbookSharePopup;
