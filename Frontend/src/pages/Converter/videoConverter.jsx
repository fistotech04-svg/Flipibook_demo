import React, { useState, useRef, useEffect } from 'react';

// Default island aerial video thumbnail matching the screenshot
const DEFAULT_VIDEO_THUMB = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80';

const VideoConverter = ({ onBack, onConvert, onReset, fileData, initialConfig }) => {
  const [selectedFormat, setSelectedFormat] = useState('MP4');
  const [resolution, setResolution] = useState('Original (Keep Same)');
  const [frameRate, setFrameRate] = useState('Original (Keep Same)');
  const [videoCodec, setVideoCodec] = useState('H.264 (Recommended)');
  const [quality, setQuality] = useState('High (Better Quality)');
  
  const [openDropdown, setOpenDropdown] = useState(null); // 'resolution' | 'frameRate' | 'videoCodec' | 'quality' | null
  const [isConverted, setIsConverted] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [formatError, setFormatError] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Video playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(28);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef(null);

  // Fallback or passed file
  const file = fileData || {
    name: 'nature.jpg',
    size: '6.5 MB',
    resolution: '4000 x 3000',
    previewUrl: DEFAULT_VIDEO_THUMB,
  };

  const [fileName, setFileName] = useState(file.name || 'nature.mp4');

  // Parse original size for estimated calculation
  const getOriginalBytes = () => {
    if (file.rawFile?.size) return file.rawFile.size;
    if (file.size) {
      const match = file.size.match(/([\d.]+)\s*(MB|KB|GB)/i);
      if (match) {
        const val = parseFloat(match[1]);
        const unit = match[2].toUpperCase();
        if (unit === 'KB') return Math.round(val * 1024);
        if (unit === 'MB') return Math.round(val * 1024 * 1024);
        if (unit === 'GB') return Math.round(val * 1024 * 1024 * 1024);
      }
    }
    return 52 * 1024 * 1024;
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 MB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Calculate dynamic estimated size based on settings
  const calculateEstimatedSize = () => {
    const origBytes = getOriginalBytes();
    let factor = 0.35; // default ~35% (e.g. 52MB -> 18MB)

    // Quality factor
    if (quality.includes('High')) factor *= 1.1;
    else if (quality.includes('Medium')) factor *= 0.85;
    else if (quality.includes('Low')) factor *= 0.6;

    // Codec factor
    if (videoCodec.includes('H.265') || videoCodec.includes('AV1')) factor *= 0.75;
    else if (videoCodec.includes('VP9')) factor *= 0.85;

    // Resolution factor
    if (resolution.includes('720p')) factor *= 0.7;
    else if (resolution.includes('480p')) factor *= 0.45;

    const estBytes = Math.round(origBytes * factor);
    return formatBytes(estBytes);
  };

  const estimatedConvertedSize = calculateEstimatedSize();

  const formats = ['MP4', 'MOV', 'AVI', 'WMV', 'MKV'];

  const resolutionOptions = [
    'Original (Keep Same)',
    '1080p (Full HD)',
    '720p (HD)',
    '480p (SD)',
  ];

  const frameRateOptions = [
    'Original (Keep Same)',
    '60 FPS',
    '30 FPS',
    '24 FPS (Cinematic)',
  ];

  const videoCodecOptions = [
    'H.264 (Recommended)',
    'H.265 (HEVC - High Compression)',
    'VP9',
    'AV1',
  ];

  const qualityOptions = [
    'High (Better Quality)',
    'Medium (Balanced)',
    'Low (Smaller Size)',
  ];

  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatTime = (timeInSec) => {
    const mins = Math.floor(timeInSec / 60);
    const secs = Math.floor(timeInSec % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleAction = () => {
    if (!selectedFormat) {
      setFormatError(true);
      return;
    }
    setFormatError(false);
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      setIsConverted(true);
      if (onConvert) {
        onConvert({
          file,
          format: selectedFormat,
          resolution,
          frameRate,
          videoCodec,
          quality,
        });
      }
    }, 1200);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = file.previewUrl || DEFAULT_VIDEO_THUMB;
    const baseName = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
    link.download = `${baseName}.${selectedFormat.toLowerCase()}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isVideoFile = file.rawFile && file.rawFile.type && file.rawFile.type.startsWith('video/');

  return (
    <div className="w-full min-h-[calc(100vh-8vh)] bg-white flex flex-col items-center justify-start pt-16 pb-16 px-6 select-none" ref={dropdownRef}>
      <div className="w-[90%] max-w-[1180px] flex flex-col lg:flex-row items-start justify-between gap-12">
        
        {/* LEFT COLUMN: Video Player / Thumbnail Preview */}
        <div className="w-full lg:w-[42%] max-w-[460px] flex flex-col justify-between self-stretch">
          <div>
            {/* Video Player Card */}
            <div className="w-full rounded-[14px] bg-white border border-gray-200 shadow-sm p-3.5 transition-all">
              <div className="relative w-full h-[280px] rounded-[10px] overflow-hidden bg-black flex items-center justify-center group">
                {isVideoFile ? (
                  <video
                    ref={videoRef}
                    src={file.previewUrl}
                    className="w-full h-full object-cover"
                    onTimeUpdate={() => {
                      if (videoRef.current) {
                        setCurrentTime(videoRef.current.currentTime);
                      }
                    }}
                    onLoadedMetadata={() => {
                      if (videoRef.current) {
                        setDuration(videoRef.current.duration);
                      }
                    }}
                    onEnded={() => setIsPlaying(false)}
                  />
                ) : (
                  <img
                    src={file.previewUrl || DEFAULT_VIDEO_THUMB}
                    alt={fileName || 'Video thumbnail'}
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Big Center Play Button Overlay */}
                <button
                  type="button"
                  onClick={togglePlay}
                  className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-white/20 backdrop-blur-md border border-white/60 flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer shadow-lg group-hover:bg-white/30"
                >
                  {isPlaying ? (
                    <svg className="w-7 h-7 text-white fill-current" viewBox="0 0 24 24">
                      <rect x="6" y="4" width="4" height="16" rx="1" />
                      <rect x="14" y="4" width="4" height="16" rx="1" />
                    </svg>
                  ) : (
                    <svg className="w-8 h-8 text-white fill-current translate-x-0.5" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>

                {/* Video Controls Bar at Bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-11 bg-gradient-to-t from-black/80 via-black/50 to-transparent px-3.5 flex items-center gap-3 text-white text-[11px] font-medium z-10">
                  {/* Play/Pause icon button */}
                  <button type="button" onClick={togglePlay} className="hover:text-[#EA7233] transition-colors cursor-pointer">
                    {isPlaying ? (
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <rect x="6" y="4" width="4" height="16" />
                        <rect x="14" y="4" width="4" height="16" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </button>

                  {/* Time Counter */}
                  <span className="tabular-nums text-gray-200 text-[11px]">
                    {formatTime(currentTime)}/{formatTime(duration)}
                  </span>

                  {/* Timeline Progress Bar */}
                  <div 
                    className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden cursor-pointer relative"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const pos = (e.clientX - rect.left) / rect.width;
                      const newTime = pos * duration;
                      setCurrentTime(newTime);
                      if (videoRef.current) {
                        videoRef.current.currentTime = newTime;
                      }
                    }}
                  >
                    <div 
                      className="h-full bg-white rounded-full transition-all"
                      style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                    />
                  </div>

                  {/* Volume Button */}
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsMuted(!isMuted);
                      if (videoRef.current) videoRef.current.muted = !isMuted;
                    }} 
                    className="hover:text-gray-300 transition-colors cursor-pointer"
                  >
                    {isMuted ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      </svg>
                    )}
                  </button>

                  {/* Fullscreen icon */}
                  <button 
                    type="button"
                    onClick={() => {
                      if (videoRef.current?.requestFullscreen) {
                        videoRef.current.requestFullscreen();
                      }
                    }}
                    className="hover:text-gray-300 transition-colors cursor-pointer"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Video Meta Info Bar */}
            <div className="w-full mt-4 bg-[#F6F9FD] border border-[#F6F9FD] rounded-[8px] px-4 py-3 flex items-center gap-3.5 transition-all">
              {/* Play symbol box */}
              <div className="w-10 h-10 rounded-[6px] border border-[#d1d9e2] bg-white/80 flex items-center justify-center flex-shrink-0 text-[#1e293b]">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M6 4l15 8-15 8V4z" />
                </svg>
              </div>

              {/* File meta */}
              <div className="min-w-0 flex flex-col justify-center">
                <span className="text-[14px] font-bold text-[#1e293b] truncate block leading-snug">
                  {fileName}
                </span>
                <span className="text-[12px] text-[#64748b] font-medium leading-tight mt-0.5">
                  {file.size || '6.5 MB'} • {file.resolution || '4000 x 3000'}
                </span>
              </div>
            </div>
          </div>

          {/* Back button on Left Column if converted */}
          {isConverted && (
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setIsConverted(false)}
                className="inline-flex items-center gap-2 px-8 py-2.5 bg-white border border-[#d1d5db] hover:bg-[#f8fafc] active:scale-98 rounded-[6px] text-sm font-medium text-[#1e293b] shadow-sm transition-all cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
                <span>Back</span>
              </button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Settings or Success Screen */}
        <div className="w-full lg:w-[54%] flex flex-col">
          {isConverted ? (
            /* CONVERSION COMPLETE VIEW */
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
                    Your video has been converted successfully.
                  </p>
                </div>
              </div>

              {/* File Title Bar */}
              <div className="w-full mt-3.5 bg-white border border-gray-200 rounded-[8px] px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-[6px] border border-gray-200 bg-[#f8fafc] flex items-center justify-center text-[#1e293b] flex-shrink-0">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M6 4l15 8-15 8V4z" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex flex-col justify-center">
                    {isEditingName ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={fileName}
                          onChange={(e) => setFileName(e.target.value)}
                          className="text-[13px] font-bold text-[#1e293b] border border-[#EA7233] rounded px-1.5 py-0.5 outline-none"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') setIsEditingName(false);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setIsEditingName(false)}
                          className="text-[11px] font-bold text-[#EA7233] hover:underline cursor-pointer"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-bold text-[#1e293b] truncate">
                          {fileName}
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsEditingName(true)}
                          className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                          title="Rename file"
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                          </svg>
                        </button>
                      </div>
                    )}
                    <span className="text-[12px] text-[#64748b] font-medium leading-tight mt-0.5">
                      Video <span className="mx-1 text-gray-300">|</span> MP4 → {selectedFormat} <span className="mx-1 text-gray-300">|</span> {file.size || '52 MB'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Before & After Cards */}
              <div className="w-full flex items-center gap-4 mt-3.5">
                <div className="flex-1 bg-[#f8fafc] border border-gray-100 rounded-[8px] p-3.5">
                  <span className="text-[11px] font-medium text-gray-400 block">Original File</span>
                  <span className="text-[18px] font-bold text-[#1e293b] mt-0.5 block">{file.size || '52 MB'}</span>
                  <span className="text-[11px] font-medium text-[#64748b] mt-0.5 block">Format: MP4</span>
                </div>

                <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>

                <div className="flex-1 bg-[#f0fdf4] border border-[#dcfce7] rounded-[8px] p-3.5">
                  <span className="text-[11px] font-semibold text-[#16a34a] block">Converted File</span>
                  <span className="text-[18px] font-bold text-[#16a34a] mt-0.5 block">{estimatedConvertedSize}</span>
                  <span className="text-[11px] font-medium text-[#16a34a] mt-0.5 block">Format: {selectedFormat}</span>
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

              {/* Reset to convert another */}
              <div className="w-full flex items-center justify-center mt-3">
                <button
                  type="button"
                  onClick={() => {
                    if (onReset) onReset();
                    else setIsConverted(false);
                  }}
                  className="w-full bg-white border border-gray-200 hover:bg-gray-50 active:scale-98 rounded-[8px] py-2.5 px-3 text-[12px] font-medium text-[#1e293b] shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <svg className="w-4 h-4 text-[#1e293b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Convert Another Video</span>
                </button>
              </div>
            </div>
          ) : (
            /* CONVERSION SETTINGS VIEW (Matching Screenshot) */
            <div>
              {/* Header: Title */}
              <div className="flex items-start justify-between gap-4 pb-2">
                <div className="flex items-center gap-3.5">
                  {/* Video Icon Box */}
                  <div className="w-11 h-11 rounded-[8px] border border-gray-200 bg-white flex items-center justify-center text-[#1e293b] flex-shrink-0">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="20" height="15" x="2" y="4" rx="2" />
                      <polyline points="10 9 15 11.5 10 14" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-[22px] font-bold text-[#1e293b] leading-tight">
                      Convert Video
                    </h1>
                    <p className="text-[13px] text-[#64748b] mt-0.5">
                      Reduce the file size while maintaining good quality.
                    </p>
                  </div>
                </div>
              </div>

              {/* 1. Output Format */}
              <div className="mt-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-[15px] font-bold text-[#1e293b]">
                    1. Output Format
                  </h2>
                  {formatError && (
                    <span className="text-[12px] font-medium text-red-500 animate-pulse">
                      Please select an output format
                    </span>
                  )}
                </div>
                <div className={`grid grid-cols-5 gap-3 p-1 rounded-[10px] transition-all ${formatError ? 'ring-2 ring-red-400 bg-red-50/20' : ''}`}>
                  {formats.map((format) => {
                    const isSelected = selectedFormat === format;
                    return (
                      <button
                        key={format}
                        type="button"
                        onClick={() => {
                          setSelectedFormat(format);
                          setFormatError(false);
                        }}
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

              {/* 2. Resolution & 3. Frame Rate in Row */}
              <div className="grid grid-cols-2 gap-4 mt-5">
                {/* 2. Resolution */}
                <div className="relative">
                  <h2 className="text-[14px] font-bold text-[#1e293b] mb-1.5">
                    2. Resolution <span className="text-gray-400 font-normal text-[12px]">(Optional)</span>
                  </h2>
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
                              isSelected ? 'font-semibold text-[#EA7233] bg-[#fffaf6]' : 'text-[#1e293b] hover:bg-gray-50'
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

                {/* 3. Frame Rate */}
                <div className="relative">
                  <h2 className="text-[14px] font-bold text-[#1e293b] mb-1.5">
                    3. Frame Rate <span className="text-gray-400 font-normal text-[12px]">(Optional)</span>
                  </h2>
                  <div
                    onClick={() => setOpenDropdown(openDropdown === 'frameRate' ? null : 'frameRate')}
                    className={`w-full flex items-center justify-between bg-white border ${
                      openDropdown === 'frameRate' ? 'border-[#EA7233] ring-1 ring-[#EA7233]/20' : 'border-gray-200 hover:border-gray-300'
                    } rounded-[6px] px-3.5 py-2.5 text-[13px] font-medium text-[#1e293b] cursor-pointer shadow-sm transition-all select-none`}
                  >
                    <span className="truncate">{frameRate}</span>
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${
                        openDropdown === 'frameRate' ? 'rotate-180 text-[#EA7233]' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>

                  {openDropdown === 'frameRate' && (
                    <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-gray-100 rounded-[8px] shadow-[0_8px_24px_rgba(0,0,0,0.12)] py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                      {frameRateOptions.map((opt) => {
                        const isSelected = frameRate === opt;
                        return (
                          <div
                            key={opt}
                            onClick={() => {
                              setFrameRate(opt);
                              setOpenDropdown(null);
                            }}
                            className={`px-3.5 py-2.5 text-[13px] cursor-pointer transition-colors text-left flex items-center justify-between ${
                              isSelected ? 'font-semibold text-[#EA7233] bg-[#fffaf6]' : 'text-[#1e293b] hover:bg-gray-50'
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

              {/* 4. Settings (Optional) */}
              <div className="mt-5">
                <h2 className="text-[14px] font-bold text-[#1e293b] mb-2.5">
                  4. Settings <span className="text-gray-400 font-normal text-[12px]">(Optional)</span>
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  {/* Video Codec */}
                  <div className="relative">
                    <label className="text-[12px] font-medium text-[#64748b] block mb-1">
                      Video Code
                    </label>
                    <div
                      onClick={() => setOpenDropdown(openDropdown === 'videoCodec' ? null : 'videoCodec')}
                      className={`w-full flex items-center justify-between bg-white border ${
                        openDropdown === 'videoCodec' ? 'border-[#EA7233] ring-1 ring-[#EA7233]/20' : 'border-gray-200 hover:border-gray-300'
                      } rounded-[6px] px-3.5 py-2.5 text-[13px] font-medium text-[#1e293b] cursor-pointer shadow-sm transition-all select-none`}
                    >
                      <span className="truncate">{videoCodec}</span>
                      <svg
                        className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${
                          openDropdown === 'videoCodec' ? 'rotate-180 text-[#EA7233]' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>

                    {openDropdown === 'videoCodec' && (
                      <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-gray-100 rounded-[8px] shadow-[0_8px_24px_rgba(0,0,0,0.12)] py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                        {videoCodecOptions.map((opt) => {
                          const isSelected = videoCodec === opt;
                          return (
                            <div
                              key={opt}
                              onClick={() => {
                                setVideoCodec(opt);
                                setOpenDropdown(null);
                              }}
                              className={`px-3.5 py-2.5 text-[13px] cursor-pointer transition-colors text-left flex items-center justify-between ${
                                isSelected ? 'font-semibold text-[#EA7233] bg-[#fffaf6]' : 'text-[#1e293b] hover:bg-gray-50'
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

                  {/* Quality */}
                  <div className="relative">
                    <label className="text-[12px] font-medium text-[#64748b] block mb-1">
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
                                isSelected ? 'font-semibold text-[#EA7233] bg-[#fffaf6]' : 'text-[#1e293b] hover:bg-gray-50'
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

              {/* Bottom Buttons */}
              <div className="w-full flex items-center justify-between mt-8">
                {/* Back Button */}
                <button
                  type="button"
                  onClick={onBack || (() => window.history.back())}
                  className="inline-flex items-center gap-2 px-8 py-2.5 bg-white border border-[#d1d5db] hover:bg-[#f8fafc] active:scale-98 rounded-[6px] text-sm font-medium text-[#1e293b] shadow-sm transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12" />
                    <polyline points="12 19 5 12 12 5" />
                  </svg>
                  <span>Back</span>
                </button>

                {/* Convert Button */}
                <button
                  type="button"
                  onClick={handleAction}
                  disabled={isProcessing}
                  className={`inline-flex items-center gap-2 px-8 py-2.5 bg-[#EA7233] hover:bg-[#d86326] active:scale-98 text-white rounded-[6px] text-sm font-medium shadow-sm transition-all cursor-pointer ${
                    isProcessing ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Converting...</span>
                    </>
                  ) : (
                    <>
                      <span>Convert</span>
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
    </div>
  );
};

export default VideoConverter;
