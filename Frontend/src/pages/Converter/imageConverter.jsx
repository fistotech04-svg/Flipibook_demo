import React, { useState, useRef, useEffect } from 'react';

// Default amber dropper bottle image matching the screenshot as fallback
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1608248597359-1e16c80521ba?w=800&q=80';

const ImageConverter = ({ onBack, onConvert, onReset, fileData, initialConfig }) => {
  const [selectedFormat, setSelectedFormat] = useState('JPG');
  const [quality, setQuality] = useState('Original (Keep Quality)');
  const [resolution, setResolution] = useState('Original');
  const [openDropdown, setOpenDropdown] = useState(null); // 'quality' | 'resolution' | null
  const [isConverted, setIsConverted] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // File information passed from upload page or fallback to demo
  const file = fileData || {
    name: 'nature.jpg',
    size: '8.4 MB',
    resolution: '4000 x 3000',
    previewUrl: DEFAULT_IMAGE,
  };

  const [fileName, setFileName] = useState(file.name || 'Chair_Image.jpg');

  // Extract original extension
  const getOriginalExt = (name) => {
    if (!name) return 'JPG';
    const parts = name.split('.');
    return parts.length > 1 ? parts.pop().toUpperCase() : 'JPG';
  };

  const originalFormat = getOriginalExt(file.name);

  // Calculate converted size estimate
  const getConvertedSize = () => {
    if (file.size && file.size.includes('MB')) {
      const num = parseFloat(file.size);
      if (!isNaN(num)) {
        return (num * 0.49).toFixed(1) + ' MB';
      }
    }
    return '4.1 MB';
  };

  const convertedSize = getConvertedSize();

  const qualityRef = useRef(null);
  const resolutionRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        qualityRef.current && !qualityRef.current.contains(e.target) &&
        resolutionRef.current && !resolutionRef.current.contains(e.target)
      ) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle ESC key and disable body scroll when preview modal is open
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

  const formats = ['JPG', 'PNG', 'WEBP', 'AVIF', 'TIFF'];

  const qualityOptions = [
    'Original (Keep Quality)',
    'High',
    'Medium',
    'Low',
  ];

  const resolutionOptions = [
    'Original',
    'Optimized (Recommended)',
    'Low',
  ];

  const handleAction = () => {
    // Transition to converted result screen
    setIsConverted(true);
    if (onConvert) {
      onConvert({
        file,
        format: selectedFormat,
        quality,
        resolution,
      });
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = file.previewUrl || DEFAULT_IMAGE;
    const baseName = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
    link.download = `${baseName}.${selectedFormat.toLowerCase()}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePreview = () => {
    setIsPreviewOpen(true);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: fileName,
        text: `Converted image: ${fileName}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 2000);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-8vh)] bg-white flex flex-col items-center justify-start pt-24 pb-16 px-6 select-none">
      <div className="w-[88%] max-w-[1160px] flex flex-col lg:flex-row items-start justify-between gap-12">
        
        {/* LEFT COLUMN: Image Preview */}
        <div className="w-full lg:w-[40%] max-w-[430px] flex flex-col justify-between self-stretch">
          <div>
            {/* Main Image Preview */}
            <div className="w-full rounded-[12px] bg-white border border-gray-200 shadow-sm p-3.5 transition-all duration-300">
              <div 
                onClick={handlePreview}
                className="relative w-full h-[280px] rounded-[8px] overflow-hidden bg-[#f8fafc] flex items-center justify-center cursor-pointer group"
                title="Click to view full screen preview"
              >
                <img
                  src={file.previewUrl || DEFAULT_IMAGE}
                  alt={fileName || 'Preview'}
                  className="w-full h-full object-contain p-1 transition-transform duration-300 group-hover:scale-102"
                />
                {/* Pill preview badge when converted */}
                {isConverted && (
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

            {/* File Info Bar (only when on configuration step) */}
            {!isConverted && (
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
                    {file.size || '8.4 MB'} {file.resolution ? ` • ${file.resolution}` : ' • 4000 x 3000'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Back button in Left Bottom Corner when converted */}
          {isConverted && (
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setIsConverted(false)}
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

        {/* RIGHT COLUMN: Settings or Conversion Complete Screen */}
        <div className="w-full lg:w-[56%] flex flex-col">
          {isConverted ? (
            /* CONVERSION COMPLETE VIEW (Screenshots 1 & 2) */
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
                    Conversion Complete!
                  </h2>
                  <p className="text-[13px] text-[#64748b] mt-0.5">
                    Your image has been converted successfully.
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
                    Image <span className="mx-1 text-gray-300">|</span> {originalFormat} → {selectedFormat} <span className="mx-1 text-gray-300">|</span> {file.size || '8.4 MB'}
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
                    {file.size || '8.4 MB'}
                  </span>
                  <span className="text-[11px] font-medium text-[#64748b] mt-0.5 block">
                    Format: {originalFormat}
                  </span>
                </div>

                {/* Arrow */}
                <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>

                {/* Converted File */}
                <div className="flex-1 bg-[#f0fdf4] border border-[#dcfce7] rounded-[8px] p-3.5">
                  <span className="text-[11px] font-semibold text-[#16a34a] block">
                    Converted File
                  </span>
                  <span className="text-[18px] font-bold text-[#16a34a] mt-0.5 block">
                    {convertedSize}
                  </span>
                  <span className="text-[11px] font-medium text-[#16a34a] mt-0.5 block">
                    Format: {selectedFormat}
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

              {/* Row of 2 Buttons: Preview and Convert Another File */}
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
                      setIsConverted(false);
                    }
                  }}
                  className="bg-white border border-gray-200 hover:bg-gray-50 active:scale-98 rounded-[8px] py-2.5 px-3 text-[12px] font-medium text-[#1e293b] shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <svg className="w-4 h-4 text-[#1e293b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Convert Another File</span>
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
            /* CONVERSION SETTINGS VIEW */
            <div>
              {/* Header: Title */}
              <div className="flex items-start justify-between gap-4 pb-2">
                <div className="flex items-center gap-3.5">
                  {/* Icon box */}
                  <div className="w-11 h-11 rounded-[8px] border border-gray-200 bg-white flex items-center justify-center text-[#1e293b] flex-shrink-0">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-[22px] font-bold text-[#1e293b] leading-tight">
                      Convert Image
                    </h1>
                    <p className="text-[13px] text-[#64748b] mt-0.5">
                      Select the output format for your file.
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 1: Output Format */}
              <div className="mt-6">
                <h2 className="text-[15px] font-bold text-[#1e293b] mb-3">
                  1. Output Format
                </h2>
                <div className="grid grid-cols-5 gap-3">
                  {formats.map((format) => {
                    const isSelected = selectedFormat === format;
                    return (
                      <button
                        key={format}
                        type="button"
                        onClick={() => setSelectedFormat(format)}
                        className={`relative h-[86px] rounded-[8px] flex flex-col items-center justify-center p-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'border border-[#EA7233] bg-[#fffaf6] shadow-sm'
                            : 'border border-[#E5E9EF] bg-[#fafbfc] hover:bg-white'
                        }`}
                      >
                        {/* Top-left Radio Dot Indicator */}
                        <div className="absolute top-2 left-2">
                          <div
                            className={`w-2.5 h-2.5 rounded-full border flex items-center justify-center ${
                              isSelected
                                ? 'border-[#EA7233] bg-white'
                                : 'border-gray-300 bg-white'
                            }`}
                          >
                            {isSelected && (
                              <div className="w-1.5 h-1.5 rounded-full bg-[#EA7233]" />
                            )}
                          </div>
                        </div>

                        {/* File Icon */}
                        <svg
                          className={`w-6 h-6 mb-1 ${
                            isSelected ? 'text-[#EA7233]' : 'text-[#1e293b]'
                          }`}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>

                        {/* Format Name */}
                        <span
                          className={`text-[12px] font-bold ${
                            isSelected ? 'text-[#EA7233]' : 'text-[#1e293b]'
                          }`}
                        >
                          {format}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section 2: Settings (Optional) */}
              <div className="mt-6">
                <h2 className="text-[15px] font-bold text-[#1e293b] mb-3">
                  2. Settings <span className="text-gray-400 font-normal">(Optional)</span>
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  {/* Quality Dropdown */}
                  <div className="relative" ref={qualityRef}>
                    <label className="text-[12px] font-medium text-[#64748b] block mb-1.5">
                      Quality
                    </label>
                    <div
                      onClick={() => setOpenDropdown(openDropdown === 'quality' ? null : 'quality')}
                      className={`w-full flex items-center justify-between bg-white border ${
                        openDropdown === 'quality' ? 'border-[#EA7233] ring-1 ring-[#EA7233]/20' : 'border-gray-200 hover:border-gray-300'
                      } rounded-[6px] px-3.5 py-2.5 text-[13px] font-medium text-[#1e293b] cursor-pointer shadow-sm transition-all select-none`}
                    >
                      <span className="truncate">{quality}</span>
                      <svg
                        className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${
                          openDropdown === 'quality' ? 'rotate-180 text-[#EA7233]' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>

                    {/* Quality Dropdown Menu */}
                    {openDropdown === 'quality' && (
                      <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-gray-100 rounded-[8px] shadow-[0_8px_24px_rgba(0,0,0,0.12)] py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                        {qualityOptions.map((opt) => {
                          const isSelected = quality === opt;
                          return (
                            <div
                              key={opt}
                              onClick={() => {
                                setQuality(opt);
                                setOpenDropdown(null);
                              }}
                              className={`px-3.5 py-2.5 text-[13px] cursor-pointer transition-colors text-left flex items-center justify-between ${
                                isSelected
                                  ? 'font-semibold text-[#EA7233] bg-[#fffaf6]'
                                  : 'text-[#1e293b] hover:bg-gray-50'
                              }`}
                            >
                              <span>{opt}</span>
                              {isSelected && (
                                <svg className="w-3.5 h-3.5 text-[#EA7233]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Resolution Dropdown */}
                  <div className="relative" ref={resolutionRef}>
                    <label className="text-[12px] font-medium text-[#64748b] block mb-1.5">
                      Resolution
                    </label>
                    <div
                      onClick={() => setOpenDropdown(openDropdown === 'resolution' ? null : 'resolution')}
                      className={`w-full flex items-center justify-between bg-white border ${
                        openDropdown === 'resolution' ? 'border-[#EA7233] ring-1 ring-[#EA7233]/20' : 'border-gray-200 hover:border-gray-300'
                      } rounded-[6px] px-3.5 py-2.5 text-[13px] font-medium text-[#1e293b] cursor-pointer shadow-sm transition-all select-none`}
                    >
                      <span className="truncate">{resolution}</span>
                      <svg
                        className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${
                          openDropdown === 'resolution' ? 'rotate-180 text-[#EA7233]' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>

                    {/* Resolution Dropdown Menu */}
                    {openDropdown === 'resolution' && (
                      <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-gray-100 rounded-[8px] shadow-[0_8px_24px_rgba(0,0,0,0.12)] py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                        {resolutionOptions.map((opt) => {
                          const isSelected = resolution === opt;
                          return (
                            <div
                              key={opt}
                              onClick={() => {
                                setResolution(opt);
                                setOpenDropdown(null);
                              }}
                              className={`px-3.5 py-2.5 text-[13px] cursor-pointer transition-colors text-left flex items-center justify-between ${
                                isSelected
                                  ? 'font-semibold text-[#EA7233] bg-[#fffaf6]'
                                  : 'text-[#1e293b] hover:bg-gray-50'
                              }`}
                            >
                              <span>{opt}</span>
                              {isSelected && (
                                <svg className="w-3.5 h-3.5 text-[#EA7233]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Action Buttons */}
              <div className="w-full flex items-center justify-between mt-8">
                {/* Back Button */}
                <button
                  type="button"
                  onClick={onBack || (() => window.history.back())}
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

                {/* Convert Button */}
                <button
                  type="button"
                  onClick={handleAction}
                  className="inline-flex items-center gap-2 px-8 py-2.5 bg-[#EA7233] hover:bg-[#d86326] active:scale-98 text-white rounded-[6px] text-sm font-medium shadow-sm transition-all cursor-pointer"
                >
                  <span>Convert</span>
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

          {/* Full Screen Image Container with medium size */}
          <div 
            className="w-full h-full flex items-center justify-center p-4 md:p-6"
            onClick={() => setIsPreviewOpen(false)}
          >
            <img
              src={file.previewUrl || DEFAULT_IMAGE}
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

export default ImageConverter;
