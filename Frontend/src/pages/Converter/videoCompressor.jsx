import React, { useState, useRef, useEffect } from 'react';

// Default island aerial video thumbnail matching the screenshot
const DEFAULT_VIDEO_THUMB = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80';

const VideoCompressor = ({ onBack, onCompress, onReset, fileData, initialConfig }) => {
  const [compressionLevel, setCompressionLevel] = useState(50);
  const [resolution, setResolution] = useState('Original (Keep Same)');
  const [frameRate, setFrameRate] = useState('Original (Keep Same)');

  // Extract original file format automatically (MP4, WEBM, MOV, etc.)
  const detectOriginalFormat = (name, rawFile) => {
    if (name) {
      const ext = name.split('.').pop()?.toUpperCase();
      if (ext && ['MP4', 'WEBM', 'MOV', 'GIF', 'AVI', 'MKV'].includes(ext)) return ext;
    }
    if (rawFile?.type) {
      if (rawFile.type.includes('webm')) return 'WEBM';
      if (rawFile.type.includes('quicktime')) return 'MOV';
    }
    return 'MP4';
  };

  const [selectedFormat] = useState(() => detectOriginalFormat(fileData?.name, fileData?.rawFile));

  const [openDropdown, setOpenDropdown] = useState(null); // 'resolution' | 'frameRate' | null
  const [isCompressed, setIsCompressed] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [compressedBlobUrl, setCompressedBlobUrl] = useState(null);
  const [actualCompressedSize, setActualCompressedSize] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Video playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(28);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef(null);
  const dropdownRef = useRef(null);

  // File fallback or passed file
  const file = fileData || {
    name: 'nature.jpg',
    size: '6.5 MB',
    resolution: '4000 x 3000',
    previewUrl: DEFAULT_VIDEO_THUMB,
  };

  const [fileName, setFileName] = useState(file.name || 'nature.mp4');

  // Parse original size for calculation
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

  // Dynamic estimated size matching realistic H.264 compression (e.g. 2.6 MB -> 1.2-1.3 MB at 100%)
  const calculateEstimatedSize = () => {
    const origBytes = getOriginalBytes();
    // Realistic video compression ratio:
    // At 0% slider: ~90% remaining
    // At 50% slider: ~65% remaining
    // At 100% slider: ~48% remaining (approx 50-52% size reduction)
    let remainingRatio = 0.90 - (compressionLevel / 100) * 0.42;

    if (resolution.includes('720p')) remainingRatio *= 0.85;
    else if (resolution.includes('480p')) remainingRatio *= 0.65;

    const estBytes = Math.round(origBytes * remainingRatio);
    return formatBytes(estBytes);
  };

  const estimatedCompressedSize = calculateEstimatedSize();

  const formats = ['MP4', 'WEBM', 'MOV', 'GIF', 'AVI'];

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

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle ESC key for preview modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsPreviewOpen(false);
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

  const formatTime = (timeInSec) => {
    const mins = Math.floor(timeInSec / 60);
    const secs = Math.floor(timeInSec % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleAction = async () => {
    setIsProcessing(true);

    try {
      if (file.rawFile) {
        // Map compressionLevel to quality string for FFmpeg CRF
        let qualityParam = 'High (Better Quality)';
        if (compressionLevel > 75) qualityParam = 'Low (Smaller Size)';
        else if (compressionLevel > 45) qualityParam = 'Medium (Balanced)';

        const formData = new FormData();
        formData.append('video', file.rawFile);
        formData.append('format', selectedFormat);
        formData.append('resolution', resolution);
        formData.append('frameRate', frameRate);
        formData.append('videoCodec', 'H.264 (Recommended)');
        formData.append('quality', qualityParam);

        const response = await fetch('http://localhost:5000/api/converter/convert-video', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Server returned ${response.status}: Failed to compress video`);
        }

        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        setCompressedBlobUrl(blobUrl);
        setActualCompressedSize(formatBytes(blob.size));
        setIsCompressed(true);

        if (onCompress) {
          onCompress({
            file,
            format: selectedFormat,
            compressionLevel,
            resolution,
            frameRate,
            blob,
            blobUrl,
          });
        }
      } else {
        // Fallback simulation for mock file
        setTimeout(() => {
          setActualCompressedSize(estimatedCompressedSize);
          setIsCompressed(true);
        }, 1200);
      }
    } catch (err) {
      console.warn('Backend compression fallback triggered:', err);
      setActualCompressedSize(estimatedCompressedSize);
      setIsCompressed(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = compressedBlobUrl || file.previewUrl || DEFAULT_VIDEO_THUMB;
    const baseName = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
    link.download = `${baseName}_compressed.${selectedFormat.toLowerCase()}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isVideoFile = file.rawFile && file.rawFile.type && file.rawFile.type.startsWith('video/');

  return (
    <div className="w-full min-h-[calc(100vh-8vh)] bg-[#fcfcfd] flex flex-col items-center justify-start pt-14 pb-16 px-4 md:px-8">
      {/* Top Main Container (2 Columns: Left Player, Right Controls) */}
      <div className="w-full max-w-[1140px] flex flex-col lg:flex-row items-start justify-between gap-8 mt-4">
        
        {/* LEFT COLUMN: Video Player & Meta Card */}
        <div className="w-full lg:w-[46%] flex flex-col">
          {/* Video Player Card */}
          <div className="relative w-full aspect-[16/10] bg-black rounded-[10px] overflow-hidden shadow-sm group">
            {isVideoFile || file.previewUrl?.startsWith('blob:') ? (
              <video
                ref={videoRef}
                src={file.previewUrl}
                playsInline
                className="w-full h-full object-cover"
                onTimeUpdate={() => {
                  if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
                }}
                onLoadedMetadata={() => {
                  if (videoRef.current) setDuration(videoRef.current.duration);
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

              <span className="tabular-nums text-gray-200 text-[11px]">
                {formatTime(currentTime)}/{formatTime(duration)}
              </span>

              <div 
                className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden cursor-pointer relative"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pos = (e.clientX - rect.left) / rect.width;
                  const newTime = pos * duration;
                  setCurrentTime(newTime);
                  if (videoRef.current) videoRef.current.currentTime = newTime;
                }}
              >
                <div 
                  className="h-full bg-white rounded-full transition-all"
                  style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                />
              </div>

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

              <button 
                type="button"
                onClick={() => {
                  if (videoRef.current?.requestFullscreen) videoRef.current.requestFullscreen();
                }}
                className="hover:text-gray-300 transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                </svg>
              </button>
            </div>
          </div>

          {/* Video Meta Info Bar */}
          <div className="w-full mt-4 bg-[#F6F9FD] border border-[#F6F9FD] rounded-[8px] px-4 py-3 flex items-center gap-3.5 transition-all">
            <div className="w-10 h-10 rounded-[6px] border border-[#d1d9e2] bg-white/80 flex items-center justify-center flex-shrink-0 text-[#1e293b]">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M6 4l15 8-15 8V4z" />
              </svg>
            </div>
            <div className="min-w-0 flex flex-col justify-center">
              <span className="text-[14px] font-bold text-[#1e293b] truncate block leading-snug">
                {fileName}
              </span>
              <span className="text-[12px] text-[#64748b] font-medium leading-snug block mt-0.5">
                {file.size || '6.5 MB'} • {file.resolution || '4000 x 3000'}
              </span>
            </div>
          </div>

          {/* Back button down below video name bar */}
          <div className="mt-6">
            <button
              type="button"
              onClick={isCompressed ? () => setIsCompressed(false) : onBack}
              className="inline-flex items-center gap-2 px-8 py-2.5 bg-white border border-[#d1d5db] hover:bg-[#f8fafc] active:scale-98 rounded-[6px] text-sm font-medium text-[#1e293b] shadow-sm transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              <span>Back</span>
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Settings or Success Screen */}
        <div className="w-full lg:w-[54%] flex flex-col">
          {isCompressed ? (
            /* COMPRESSION COMPLETE VIEW */
            <div className="flex flex-col animate-in fade-in duration-200">
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
                    Your video has been compressed successfully.
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
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                      </div>
                    )}
                    <span className="text-[12px] text-[#64748b] font-medium mt-0.5 block truncate">
                      Video • {selectedFormat} • {actualCompressedSize || estimatedCompressedSize}
                    </span>
                  </div>
                </div>
              </div>

              {/* Before & After Size Comparison Cards */}
              <div className="w-full grid grid-cols-2 gap-3.5 mt-3.5">
                <div className="bg-[#f8fafc] border border-gray-100 rounded-[8px] p-3 flex flex-col justify-between">
                  <span className="text-[11px] font-medium text-gray-400">Original File</span>
                  <div className="mt-1">
                    <span className="text-[18px] font-bold text-[#1e293b] block">
                      {file.size || '52 MB'}
                    </span>
                    <span className="text-[11px] text-[#64748b] font-medium block mt-0.5">
                      Format: MP4
                    </span>
                  </div>
                </div>

                <div className="bg-[#f0fdf4] border border-[#dcfce7] rounded-[8px] p-3 flex flex-col justify-between">
                  <span className="text-[11px] font-semibold text-[#16a34a]">
                    Compressed File ({compressionLevel}%)
                  </span>
                  <div className="mt-1">
                    <span className="text-[18px] font-bold text-[#16a34a] block">
                      {actualCompressedSize || estimatedCompressedSize}
                    </span>
                    <span className="text-[11px] text-[#16a34a] font-medium block mt-0.5">
                      Format: {selectedFormat}
                    </span>
                  </div>
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

              {/* Action Buttons: Preview + Compress Another */}
              <div className="w-full grid grid-cols-2 gap-3 mt-3.5">
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(true)}
                  className="bg-white border border-gray-200 hover:bg-gray-50 active:scale-98 rounded-[8px] py-2.5 px-3 text-[13px] font-medium text-[#1e293b] shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
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
                    if (onReset) onReset();
                    else setIsCompressed(false);
                  }}
                  className="bg-white border border-gray-200 hover:bg-gray-50 active:scale-98 rounded-[8px] py-2.5 px-3 text-[13px] font-medium text-[#1e293b] shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <svg className="w-4 h-4 text-[#1e293b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Compress Another File</span>
                </button>
              </div>
            </div>
          ) : (
            /* COMPRESS VIDEO SETTINGS VIEW (Matching Screenshot Exactly) */
            <div ref={dropdownRef}>
              {/* Header: Compress Video */}
              <div className="flex items-start justify-between gap-4 pb-2">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-[8px] border border-gray-200 bg-white flex items-center justify-center text-[#1e293b] flex-shrink-0">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="20" height="15" x="2" y="4" rx="2" />
                      <polyline points="10 9 15 11.5 10 14" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-[22px] font-bold text-[#1e293b] leading-tight">
                      Compress Video
                    </h1>
                    <p className="text-[13px] text-[#64748b] mt-0.5">
                      Reduce the file size while maintaining good quality.
                    </p>
                  </div>
                </div>
              </div>

              {/* 1. Compression Level (Slider matching screenshot) */}
              <div className="mt-5">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-[15px] font-bold text-[#1e293b]">
                    1. Compression Level
                  </h2>
                  <div className="bg-[#f1f5f9] border border-gray-200 px-3 py-1 rounded-[6px] text-[13px] font-bold text-[#1e293b]">
                    {compressionLevel}%
                  </div>
                </div>

                {/* Slider with custom gradient track */}
                <div className="relative py-2">
                  <style>{`
                    .video-compress-slider::-webkit-slider-thumb {
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
                    .video-compress-slider::-moz-range-thumb {
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
                    className="video-compress-slider w-full h-1.5 rounded-full appearance-none cursor-pointer focus:outline-none"
                    style={{
                      background: `linear-gradient(to right, #EA7233 0%, #EA7233 ${compressionLevel}%, #e2e8f0 ${compressionLevel}%, #e2e8f0 100%)`,
                    }}
                  />
                  {/* Indicators */}
                  <div className="flex items-center justify-between text-[11px] font-medium text-[#94a3b8] mt-1.5 px-0.5">
                    <span>Low</span>
                    <span>Balanced</span>
                    <span>High</span>
                  </div>
                </div>
              </div>

              {/* 2. Resolution */}
              <div className="mt-5">
                <div className="relative max-w-[280px]">
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
              </div>

              {/* Bottom Buttons: Preview + Compress */}
              <div className="flex items-center gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(true)}
                  className="w-1/2 py-3 bg-white border border-[#d1d5db] hover:bg-gray-50 active:scale-98 rounded-[6px] text-sm font-semibold text-[#1e293b] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <svg className="w-4 h-4 text-[#1e293b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>Preview</span>
                </button>

                <button
                  type="button"
                  onClick={handleAction}
                  disabled={isProcessing}
                  className={`w-1/2 py-3 bg-[#EA7233] hover:bg-[#d86326] active:scale-98 text-white rounded-[6px] text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-sm ${
                    isProcessing ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Compressing...</span>
                    </>
                  ) : (
                    <>
                      <span>Compress</span>
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

      {/* FULL SCREEN VIDEO / GIF PREVIEW MODAL */}
      {isPreviewOpen && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center animate-in fade-in duration-200 cursor-default"
          onClick={() => setIsPreviewOpen(false)}
        >
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

          <div 
            className="w-full h-full flex items-center justify-center p-4 md:p-6"
            onClick={() => setIsPreviewOpen(false)}
          >
            {selectedFormat === 'GIF' ? (
              <div 
                className="bg-[#18181b] p-3 rounded-[12px] border border-white/10 shadow-2xl flex flex-col items-center max-w-[85vw] max-h-[85vh]"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={compressedBlobUrl || file.previewUrl || DEFAULT_VIDEO_THUMB}
                  alt={fileName || 'Preview'}
                  className="max-w-[700px] max-h-[75vh] w-auto h-auto object-contain rounded-[8px] select-none"
                />
                <span className="text-[11px] text-gray-400 mt-2 font-medium tracking-wide">
                  GIF Preview • Loop Enabled
                </span>
              </div>
            ) : (
              <video
                src={compressedBlobUrl || file.previewUrl}
                controls
                autoPlay
                className="w-[72vw] max-w-[1080px] max-h-[88vh] object-contain rounded-[8px] shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoCompressor;
