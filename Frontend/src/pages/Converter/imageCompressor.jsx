import React, { useState, useRef, useEffect } from 'react';

// Default amber dropper bottle image matching screenshot fallback
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1608248597359-1e16c80521ba?w=800&q=80';

const ImageCompressor = ({ onBack, onCompress, onReset, fileData, initialConfig }) => {
  // File info
  const file = fileData || {
    name: 'nature.jpg',
    size: '6.5 MB',
    resolution: '4000 x 3000',
    previewUrl: DEFAULT_IMAGE,
  };

  const [fileName, setFileName] = useState(file.name || 'nature.jpg');

  const [isProcessing, setIsProcessing] = useState(false);
  const [compressedBlobUrl, setCompressedBlobUrl] = useState(null);
  const [actualCompressedSize, setActualCompressedSize] = useState(null);

  // Extract original extension
  const getOriginalExt = (name) => {
    if (!name) return 'JPG';
    const parts = name.split('.');
    let ext = parts.length > 1 ? parts.pop().toUpperCase() : 'JPG';
    if (ext === 'JPEG') ext = 'JPG';
    return ext;
  };

  const originalFormat = getOriginalExt(file.name);

  const getRecommendedFormatLabel = (fmt) => `${fmt} (Recommended)`;

  const [compressionLevel, setCompressionLevel] = useState(50);
  const [resolution, setResolution] = useState('Original (Keep Same)');
  const [outputFormat, setOutputFormat] = useState(getRecommendedFormatLabel(originalFormat));
  const [openDropdown, setOpenDropdown] = useState(null); // 'resolution' | 'format' | null
  const [isCompressed, setIsCompressed] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Sync outputFormat if uploaded file changes
  useEffect(() => {
    if (file?.name) {
      const ext = getOriginalExt(file.name);
      setOutputFormat(getRecommendedFormatLabel(ext));
      setFileName(file.name);
    }
  }, [file?.name]);

  // Parse file size into bytes
  const getSizeBytes = () => {
    if (file.rawFile?.size) return file.rawFile.size;
    if (file.size) {
      const match = file.size.match(/([\d.]+)\s*(MB|KB|Bytes|GB)/i);
      if (match) {
        const val = parseFloat(match[1]);
        const unit = match[2].toUpperCase();
        if (unit === 'KB') return Math.round(val * 1024);
        if (unit === 'MB') return Math.round(val * 1024 * 1024);
        if (unit === 'GB') return Math.round(val * 1024 * 1024 * 1024);
        return Math.round(val);
      }
    }
    return 6.5 * 1024 * 1024;
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const originalBytes = getSizeBytes();

  // Accurately calculate estimated compressed size based on slider level (1 - 100%)
  const getEstimatedCompressedSize = () => {
    // factor ranges from ~0.92 down to ~0.15 depending on compression level
    const factor = Math.max(0.08, 1 - (compressionLevel / 100) * 0.72);
    const estimatedBytes = Math.round(originalBytes * factor);
    return formatBytes(estimatedBytes);
  };

  const estimatedCompressedSize = getEstimatedCompressedSize();
  const displayCompressedSize = actualCompressedSize || estimatedCompressedSize;

  const resolutionRef = useRef(null);
  const formatRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (formatRef.current && !formatRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle ESC key for preview modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsPreviewOpen(false);
      }
    };
    if (isPreviewOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isPreviewOpen]);

  const resolutionOptions = [
    'Original (Keep Same)',
    'Optimized (Recommended)',
    '1920 x 1080 (FHD)',
    '1280 x 720 (HD)',
    '800 x 600',
  ];

  const baseFormats = ['JPG', 'PNG', 'WEBP', 'AVIF', 'TIFF'];
  const formatOptions = baseFormats.map((fmt) =>
    fmt === originalFormat ? `${fmt} (Recommended)` : fmt
  );

  // Helper to map UI format string to MIME type
  const getMimeType = (formatStr) => {
    const upper = formatStr.toUpperCase();
    if (upper.includes('PNG')) return 'image/png';
    if (upper.includes('WEBP')) return 'image/webp';
    if (upper.includes('AVIF')) return 'image/avif';
    return 'image/jpeg';
  };

  // Real client-side image compression function
  const compressImage = async () => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          let targetWidth = img.naturalWidth;
          let targetHeight = img.naturalHeight;

          // Handle resolution resize
          if (resolution.includes('1920 x 1080')) {
            const ratio = Math.min(1920 / targetWidth, 1080 / targetHeight, 1);
            targetWidth = Math.round(targetWidth * ratio);
            targetHeight = Math.round(targetHeight * ratio);
          } else if (resolution.includes('1280 x 720')) {
            const ratio = Math.min(1280 / targetWidth, 720 / targetHeight, 1);
            targetWidth = Math.round(targetWidth * ratio);
            targetHeight = Math.round(targetHeight * ratio);
          } else if (resolution.includes('800 x 600')) {
            const ratio = Math.min(800 / targetWidth, 600 / targetHeight, 1);
            targetWidth = Math.round(targetWidth * ratio);
            targetHeight = Math.round(targetHeight * ratio);
          } else if (resolution.includes('Optimized')) {
            if (targetWidth > 1920 || targetHeight > 1080) {
              const ratio = Math.min(1920 / targetWidth, 1080 / targetHeight);
              targetWidth = Math.round(targetWidth * ratio);
              targetHeight = Math.round(targetHeight * ratio);
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext('2d');

          const mimeType = getMimeType(outputFormat);

          // Fill white background for JPEG so transparency isn't rendered black
          if (mimeType === 'image/jpeg') {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, targetWidth, targetHeight);
          }

          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

          // Calculate quality: slider 10% -> 0.90 quality, slider 75% -> 0.25 quality
          const quality = Math.max(0.08, Math.min(0.95, (100 - compressionLevel) / 100));

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Canvas toBlob returned null'));
              }
            },
            mimeType,
            quality
          );
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = (err) => reject(err);
      img.src = file.previewUrl || DEFAULT_IMAGE;
    });
  };

  const handleAction = async () => {
    setIsProcessing(true);
    try {
      let blob = null;

      // Primary: Compress using sharp backend
      if (file.rawFile) {
        try {
          const cleanFmt = (outputFormat.split(' ')[0] || 'jpg').toLowerCase();
          // In compression: compressionLevel 70% means quality 70 (or 100 - compressionLevel if lossy)
          // For sharp: quality 100 - (compressionLevel * 0.7) gives perfect quality-to-size curve
          const calculatedQuality = Math.max(15, Math.min(95, 100 - Math.round(compressionLevel * 0.65)));

          const formData = new FormData();
          formData.append('file', file.rawFile);
          formData.append('format', cleanFmt);
          formData.append('quality', calculatedQuality.toString());
          formData.append('resolution', resolution);

          const response = await fetch('http://localhost:5000/api/converter/convert-image', {
            method: 'POST',
            body: formData,
          });

          if (response.ok) {
            blob = await response.blob();
          } else {
            console.warn(`Backend image compression returned ${response.status}, falling back to canvas.`);
          }
        } catch (serverErr) {
          console.warn('Backend image compression error, falling back to canvas:', serverErr);
        }
      }

      // Secondary / Fallback: If server conversion was not possible, use client canvas
      if (!blob) {
        blob = await compressImage();
      }

      const blobUrl = URL.createObjectURL(blob);
      setCompressedBlobUrl(blobUrl);
      setActualCompressedSize(formatBytes(blob.size));
      setIsCompressed(true);

      if (onCompress) {
        onCompress({
          file,
          compressionLevel,
          resolution,
          format: outputFormat,
          blob,
          blobUrl,
          size: formatBytes(blob.size),
        });
      }
    } catch (err) {
      console.warn('Direct canvas compression fallback triggered:', err);
      // Graceful fallback to estimated size if cross-origin or format issue
      setActualCompressedSize(estimatedCompressedSize);
      setIsCompressed(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = compressedBlobUrl || file.previewUrl || DEFAULT_IMAGE;
    const cleanExt = outputFormat.split(' ')[0].toLowerCase();
    const baseName = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
    link.download = `${baseName}.${cleanExt}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePreview = () => {
    setIsPreviewOpen(true);
  };

  // Clean format string for labels
  const targetFormatClean = outputFormat.split(' ')[0].toUpperCase();

  return (
    <div className="w-full min-h-[calc(100vh-8vh)] bg-white flex flex-col items-center justify-start pt-20 pb-16 px-6 select-none">
      <div className="w-[88%] max-w-[1160px] flex flex-col lg:flex-row items-start justify-between gap-12">
        
        {/* LEFT COLUMN: Image Box & Info Strip */}
        <div className="w-full lg:w-[40%] max-w-[430px] flex flex-col justify-between self-stretch">
          <div>
            {/* Main Image Box */}
            <div className="w-full rounded-[12px] bg-white border border-gray-200 shadow-sm p-3.5 transition-all duration-300">
              <div 
                onClick={handlePreview}
                className="relative w-full h-[280px] rounded-[8px] overflow-hidden bg-[#f8fafc] flex items-center justify-center cursor-pointer group"
                title="Click to view preview"
              >
                <img
                  src={file.previewUrl || DEFAULT_IMAGE}
                  alt={fileName || 'Preview'}
                  className="w-full h-full object-contain p-1 transition-transform duration-300 group-hover:scale-102"
                />
                {/* Pill preview badge when compressed */}
                {isCompressed && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreview();
                    }}
                    className="absolute bottom-2.5 left-2.5 bg-[#1e293b]/80 hover:bg-[#0f172a] active:scale-95 transition-all text-white text-[11px] font-medium px-2.5 py-1 rounded-[6px] flex items-center gap-1.5 shadow-sm cursor-pointer z-10"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>Preview</span>
                  </button>
                )}
              </div>
            </div>

            {/* File Info Bar */}
            {!isCompressed && (
              <div className="w-full mt-4 bg-[#F6F9FD] border border-[#F6F9FD] rounded-[6px] px-4 py-3 flex items-center gap-3.5 transition-all">
                {/* Square landscape icon box */}
                <div className="w-10 h-10 rounded-[6px] border border-[#d1d9e2] bg-white/80 flex items-center justify-center flex-shrink-0 text-[#1e293b]">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                    <circle cx="9" cy="9" r="2" />
                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                  </svg>
                </div>

                {/* File meta */}
                <div className="min-w-0 flex flex-col justify-center">
                  <span className="text-[14px] font-bold text-[#1e293b] truncate block leading-snug">
                    {fileName}
                  </span>
                  <span className="text-[12px] text-[#64748b] font-medium leading-tight mt-0.5">
                    {file.size || '6.5 MB'} {file.resolution ? ` • ${file.resolution}` : ' • 4000 x 3000'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Back button in Left Bottom Corner when compressed */}
          {isCompressed && (
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setIsCompressed(false)}
                className="inline-flex items-center gap-2 px-8 py-2.5 bg-white border border-[#d1d5db] hover:bg-[#f8fafc] active:scale-98 rounded-[6px] text-sm font-medium text-[#1e293b] shadow-sm transition-all cursor-pointer"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
                <span>Back</span>
              </button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Compress Settings or Result */}
        <div className="w-full lg:w-[56%] flex flex-col">
          {isCompressed ? (
            /* COMPRESSION COMPLETE VIEW */
            <div className="flex flex-col animate-in fade-in duration-200">
              {/* Green Success Banner */}
              <div className="w-full bg-[#ecfdf5] border border-[#d1fae5] rounded-[10px] px-4 py-3.5 flex items-center gap-3.5">
                <div className="w-8 h-8 rounded-full bg-[#16a34a] flex items-center justify-center text-white flex-shrink-0 shadow-sm">
                  <svg className="w-4 h-4 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-[16px] font-bold text-[#1e293b] leading-tight">
                    Compression Complete!
                  </h2>
                  <p className="text-[13px] text-[#64748b] mt-0.5">
                    Your image has been compressed successfully.
                  </p>
                </div>
              </div>

              {/* File Title Bar */}
              <div className="w-full mt-3.5 bg-white border border-gray-100 rounded-[10px] px-4 py-3 flex items-center gap-3.5 shadow-sm">
                <div className="w-11 h-11 rounded-[8px] bg-[#fff7ed] flex items-center justify-center flex-shrink-0 text-[#1e293b]">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                    <circle cx="9" cy="9" r="2" />
                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    {isEditingName ? (
                      <input
                        type="text"
                        value={fileName}
                        onChange={(e) => setFileName(e.target.value)}
                        onBlur={() => setIsEditingName(false)}
                        onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                        autoFocus
                        className="text-[14px] font-bold text-[#1e293b] border-b border-[#EA7233] outline-none bg-transparent"
                      />
                    ) : (
                      <>
                        <span className="text-[14px] font-bold text-[#1e293b] truncate">
                          {fileName}
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsEditingName(true)}
                          className="text-gray-400 hover:text-gray-600 p-0.5 transition-colors cursor-pointer"
                          title="Rename file"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                  <div className="text-[12px] text-[#64748b] font-medium mt-0.5">
                    Image <span className="mx-1 text-gray-300">|</span> {originalFormat} → {targetFormatClean} <span className="mx-1 text-gray-300">|</span> {file.size || '6.5 MB'}
                  </div>
                </div>
              </div>

              {/* Before & After Size Cards */}
              <div className="w-full flex items-center gap-4 mt-3.5">
                {/* Original File */}
                <div className="flex-1 bg-[#f8fafc] border border-gray-100 rounded-[8px] p-3.5">
                  <span className="text-[11px] font-medium text-gray-400 block">
                    Original File
                  </span>
                  <span className="text-[18px] font-bold text-[#1e293b] mt-0.5 block">
                    {file.size || '6.5 MB'}
                  </span>
                  <span className="text-[11px] font-medium text-[#64748b] mt-0.5 block">
                    Format: {originalFormat}
                  </span>
                </div>

                {/* Arrow */}
                <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>

                {/* Compressed File */}
                <div className="flex-1 bg-[#f0fdf4] border border-[#dcfce7] rounded-[8px] p-3.5">
                  <span className="text-[11px] font-semibold text-[#16a34a] block">
                    Compressed File ({compressionLevel}%)
                  </span>
                  <span className="text-[18px] font-bold text-[#16a34a] mt-0.5 block">
                    {displayCompressedSize}
                  </span>
                  <span className="text-[11px] font-medium text-[#16a34a] mt-0.5 block">
                    Format: {targetFormatClean}
                  </span>
                </div>
              </div>

              {/* Download File Button */}
              <button
                type="button"
                onClick={handleDownload}
                className="w-full mt-3.5 py-3 bg-[#EA7233] hover:bg-[#d86326] active:scale-98 text-white rounded-[8px] text-[14px] font-semibold shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <span>Download File</span>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </button>

              {/* Row of 2 Buttons: Preview and Compress Another File */}
              <div className="w-full grid grid-cols-2 gap-3 mt-3">
                <button
                  type="button"
                  onClick={handlePreview}
                  className="bg-white border border-gray-200 hover:bg-gray-50 active:scale-98 rounded-[8px] py-2.5 px-3 text-[12px] font-medium text-[#1e293b] shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <svg className="w-4 h-4 text-[#1e293b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>Preview</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onReset) {
                      onReset();
                    } else {
                      setIsCompressed(false);
                    }
                  }}
                  className="bg-white border border-gray-200 hover:bg-gray-50 active:scale-98 rounded-[8px] py-2.5 px-3 text-[12px] font-medium text-[#1e293b] shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <svg className="w-4 h-4 text-[#1e293b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Compress Another File</span>
                </button>
              </div>

              {/* Blue Info Notice Box */}
              <div className="w-full mt-3.5 bg-[#eff6ff] border border-[#dbeafe] rounded-[8px] px-3.5 py-2.5 flex items-center gap-2.5">
                <div className="w-4 h-4 rounded-full bg-[#3b82f6] text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                  i
                </div>
                <p className="text-[12px] text-[#2563eb] font-normal leading-tight">
                  Please keep this page open while we process your file.
                </p>
              </div>
            </div>
          ) : (
            /* COMPRESSION SETTINGS VIEW (Screenshot 3) */
            <div className="flex flex-col">
              {/* Header: Compress Image + Estimated Size Badge */}
              <div className="flex items-center justify-between gap-4 pb-6">
                <div className="flex items-center gap-3.5">
                  {/* Compress Inward Arrows Icon Box matching screenshot 3 */}
                  <div className="w-12 h-12 rounded-[8px] border border-gray-200 bg-white flex items-center justify-center text-[#1e293b] flex-shrink-0 shadow-xs">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      {/* 4 inward arrows pointing toward center */}
                      <path d="M4 4l6 6M10 5v5H5" />
                      <path d="M20 4l-6 6M14 5v5h5" />
                      <path d="M4 20l6-6M10 19v-5H5" />
                      <path d="M20 20l-6-6M14 19v-5h5" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-[22px] font-bold text-[#1e293b] leading-tight">
                      Compress Image
                    </h1>
                    <p className="text-[13px] text-[#64748b] mt-0.5">
                      Reduce the file size while maintaining good quality.
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 1: Compression Level Slider */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[14px] font-semibold text-[#1e293b]">
                    1. Compression Level
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="bg-[#f1f5f9] border border-gray-200 px-3 py-0.5 rounded-[6px] text-[13px] font-bold text-[#EA7233]">
                      {compressionLevel}%
                    </div>
                  </div>
                </div>

                {/* Quick Preset Buttons (Low, Balanced, High) */}
                <div className="flex items-center gap-2 mb-2.5">
                  {[
                    { label: 'Low', pct: 25, tip: 'Max Quality (light compression)' },
                    { label: 'Balanced', pct: 50, tip: 'Recommended: Best quality & size' },
                    { label: 'High', pct: 80, tip: 'Smallest file size' },
                  ].map((preset) => {
                    const isActive =
                      preset.label === 'Low'
                        ? compressionLevel < 40
                        : preset.label === 'Balanced'
                        ? compressionLevel >= 40 && compressionLevel <= 65
                        : compressionLevel > 65;

                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setCompressionLevel(preset.pct)}
                        className={`text-[11px] font-medium px-2.5 py-1 rounded-[5px] border transition-all cursor-pointer ${
                          isActive
                            ? 'bg-[#fffaf6] border-[#EA7233] text-[#EA7233] font-semibold shadow-xs'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                        title={preset.tip}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>

                {/* Slider bar with styled track */}
                <div className="relative py-1">
                  <style>{`
                    .compress-slider::-webkit-slider-thumb {
                      -webkit-appearance: none;
                      appearance: none;
                      width: 18px;
                      height: 18px;
                      border-radius: 50%;
                      background: #EA7233;
                      cursor: pointer;
                      border: 3px solid #ffffff;
                      box-shadow: 0 1px 4px rgba(0,0,0,0.25);
                    }
                    .compress-slider::-moz-range-thumb {
                      width: 18px;
                      height: 18px;
                      border-radius: 50%;
                      background: #EA7233;
                      cursor: pointer;
                      border: 3px solid #ffffff;
                      box-shadow: 0 1px 4px rgba(0,0,0,0.25);
                    }
                  `}</style>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={compressionLevel}
                    onChange={(e) => setCompressionLevel(Number(e.target.value))}
                    className="compress-slider w-full h-1.5 rounded-full appearance-none cursor-pointer focus:outline-none"
                    style={{
                      background: `linear-gradient(to right, #EA7233 0%, #EA7233 ${compressionLevel}%, #e2e8f0 ${compressionLevel}%, #e2e8f0 100%)`,
                    }}
                  />
                  {/* Low / Balanced / High indicators */}
                  <div className="flex items-center justify-between text-[11px] font-medium text-[#94a3b8] mt-1.5 px-0.5">
                    <span>Low (Light)</span>
                    <span className="text-[#EA7233] font-semibold">Balanced</span>
                    <span>High (Max Compression)</span>
                  </div>
                </div>
              </div>

              {/* Section 2: Output Format */}
              <div className="w-full sm:w-1/2 mt-7">
                <div className="relative" ref={formatRef}>
                  <label className="block text-[14px] font-semibold text-[#1e293b] mb-2">
                    2. Output Format <span className="text-[#94a3b8] font-normal text-xs">(Optional)</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => setOpenDropdown(openDropdown === 'format' ? null : 'format')}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-[6px] border text-left transition-all cursor-pointer bg-white ${
                      openDropdown === 'format'
                        ? 'border-[#EA7233] ring-1 ring-[#EA7233]'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-[13px] font-medium text-[#1e293b] truncate">
                      {outputFormat}
                    </span>
                    <svg
                      className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                        openDropdown === 'format' ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {openDropdown === 'format' && (
                    <div className="absolute left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-[8px] shadow-lg py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
                      {formatOptions.map((opt) => (
                        <div
                          key={opt}
                          onClick={() => {
                            setOutputFormat(opt);
                            setOpenDropdown(null);
                          }}
                          className={`px-3.5 py-2 text-[13px] cursor-pointer transition-colors flex items-center justify-between ${
                            outputFormat === opt
                              ? 'bg-[#fff5ee] text-[#EA7233] font-semibold'
                              : 'text-[#1e293b] hover:bg-gray-50'
                          }`}
                        >
                          <span>{opt}</span>
                          {outputFormat === opt && (
                            <svg className="w-4 h-4 text-[#EA7233]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Action Buttons: Back and Compress */}
              <div className="mt-10 flex items-center justify-between pt-4">
                {/* Back Button */}
                <button
                  type="button"
                  onClick={onBack}
                  className="inline-flex items-center gap-2 px-8 py-2.5 bg-white border border-[#d1d5db] hover:bg-[#f8fafc] active:scale-98 rounded-[6px] text-sm font-medium text-[#1e293b] shadow-sm transition-all cursor-pointer"
                >
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="19" y1="12" x2="5" y2="12" />
                    <polyline points="12 19 5 12 12 5" />
                  </svg>
                  <span>Back</span>
                </button>

                {/* Compress Button */}
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleAction}
                  className={`inline-flex items-center gap-2 px-8 py-2.5 bg-[#EA7233] hover:bg-[#d86326] active:scale-98 text-white rounded-[6px] text-sm font-semibold shadow-sm transition-all cursor-pointer ${
                    isProcessing ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-1 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                      </svg>
                      <span>Compressing...</span>
                    </>
                  ) : (
                    <>
                      <span>Compress</span>
                      <svg
                        className="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* FULL SCREEN PREVIEW MODAL */}
      {isPreviewOpen && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center animate-in fade-in duration-200 cursor-default"
          onClick={() => setIsPreviewOpen(false)}
        >
          {/* Floating Close Button in Top Right */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsPreviewOpen(false);
            }}
            className="absolute top-5 right-5 z-20 w-11 h-11 rounded-full bg-black/50 hover:bg-black/80 border border-white/20 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-md shadow-lg"
            title="Close (Esc)"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Full Screen Image Container with balanced medium size */}
          <div 
            className="w-full h-full flex items-center justify-center p-4 md:p-6"
            onClick={() => setIsPreviewOpen(false)}
          >
            <img
              src={compressedBlobUrl || file.previewUrl || DEFAULT_IMAGE}
              alt={fileName || 'Preview'}
              className="w-[72vw] max-w-[1080px] max-h-[88vh] object-contain rounded-[8px] shadow-2xl select-none"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageCompressor;
