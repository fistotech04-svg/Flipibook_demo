import React, { useState, useEffect } from 'react';
import { X, Link, Check, Loader2, FileText, Video, Image as ImageIcon } from 'lucide-react';
import { Icon } from '@iconify/react';

const ImportViaUrlModal = ({ isOpen, onClose, activePageIndex = 0 }) => {
  const [url, setUrl] = useState('');
  const [isPreviewLoaded, setIsPreviewLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mediaType, setMediaType] = useState('image'); // 'image' | 'video' | 'pdf'
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setUrl('');
      setIsPreviewLoaded(false);
      setIsLoading(false);
      setErrorMsg('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getEmbedVideoUrl = (rawUrl) => {
    if (!rawUrl) return '';
    const url = rawUrl.trim();
    const lower = url.toLowerCase();

    // YouTube
    if (lower.includes("youtube.com") || lower.includes("youtu.be")) {
      let videoId = "";
      if (url.includes("youtu.be/")) videoId = url.split("youtu.be/")[1]?.split("?")[0]?.split("&")[0];
      else if (url.includes("watch?v=")) videoId = url.split("v=")[1]?.split("&")[0];
      else if (url.includes("shorts/")) videoId = url.split("shorts/")[1]?.split("?")[0]?.split("&")[0];
      else if (url.includes("embed/")) videoId = url.split("embed/")[1]?.split("?")[0]?.split("&")[0];
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }

    // Vimeo
    if (lower.includes("vimeo.com")) {
      let videoId = url.split("vimeo.com/")[1]?.split("?")[0]?.split("/")[0];
      if (videoId && !isNaN(videoId)) return `https://player.vimeo.com/video/${videoId}`;
    }

    // Dailymotion
    if (lower.includes("dailymotion.com") || lower.includes("dai.ly")) {
      let videoId = "";
      if (url.includes("dai.ly/")) videoId = url.split("dai.ly/")[1]?.split("?")[0];
      else if (url.includes("video/")) videoId = url.split("video/")[1]?.split("?")[0];
      if (videoId) return `https://www.dailymotion.com/embed/video/${videoId}`;
    }

    // Loom
    if (lower.includes("loom.com")) {
      let videoId = url.split("share/")[1]?.split("?")[0];
      if (videoId) return `https://www.loom.com/embed/${videoId}`;
    }

    // Wistia
    if (lower.includes("wistia.com")) {
      let videoId = url.split("medias/")[1]?.split("?")[0];
      if (videoId) return `https://fast.wistia.net/embed/iframe/${videoId}`;
    }

    // Google Drive
    if (lower.includes("drive.google.com")) {
      const match = url.match(/\/d\/([^\/]+)/);
      if (match && match[1]) return `https://drive.google.com/file/d/${match[1]}/preview`;
    }

    return url;
  };

  const detectMediaType = (inputUrl) => {
    if (!inputUrl) return 'image';
    const lower = inputUrl.toLowerCase().trim();

    // Direct Image Extensions
    if (
      lower.endsWith('.jpg') || 
      lower.endsWith('.jpeg') || 
      lower.endsWith('.png') || 
      lower.endsWith('.svg') || 
      lower.endsWith('.webp') || 
      lower.endsWith('.avif') || 
      lower.endsWith('.ico')
    ) {
      return 'image';
    }

    // Direct PDF Extension
    if (lower.endsWith('.pdf')) {
      return 'pdf';
    }

    // Video Platforms or Video Extensions / Keywords
    if (
      lower.endsWith('.mp4') || 
      lower.endsWith('.webm') || 
      lower.endsWith('.mov') || 
      lower.endsWith('.mkv') || 
      lower.endsWith('.avi') || 
      lower.endsWith('.m3u8') || 
      lower.endsWith('.flv') || 
      lower.endsWith('.wmv') || 
      lower.includes('youtube') || 
      lower.includes('youtu.be') || 
      lower.includes('vimeo') ||
      lower.includes('dailymotion') ||
      lower.includes('dai.ly') ||
      lower.includes('loom.com') ||
      lower.includes('wistia') ||
      lower.includes('tiktok') ||
      lower.includes('facebook.com/watch') ||
      lower.includes('fb.watch') ||
      lower.includes('video') ||
      lower.includes('embed') ||
      lower.includes('stream') ||
      lower.includes('player') ||
      lower.includes('v=') ||
      lower.includes('watch') ||
      lower.includes('shorts') ||
      lower.includes('reel') ||
      lower.includes('clip')
    ) {
      return 'video';
    }

    return 'image';
  };

  const handleGetPreview = () => {
    if (!url.trim()) return;
    setErrorMsg('');
    setIsLoading(true);

    const type = detectMediaType(url);
    setMediaType(type);

    if (type === 'image') {
      const img = new Image();
      img.onload = () => {
        setIsLoading(false);
        setIsPreviewLoaded(true);
      };
      img.onerror = () => {
        setIsLoading(false);
        // Still allow preview if image loading is blocked by CORS, but show fallback
        setIsPreviewLoaded(true);
      };
      img.src = url.trim();
    } else {
      setTimeout(() => {
        setIsLoading(false);
        setIsPreviewLoaded(true);
      }, 300);
    }
  };

  const getVideoOriginalDimensions = async (url) => {
    return new Promise((resolve) => {
      const lower = url.toLowerCase();
      
      // YouTube oEmbed API to fetch exact video width and height
      if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
        fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`)
          .then(res => res.json())
          .then(data => {
            if (data && data.width && data.height) {
              resolve({ width: data.width, height: data.height, aspect: data.width / data.height });
            } else {
              resolve(null);
            }
          })
          .catch(() => resolve(null));
        return;
      }

      // Vimeo oEmbed API to fetch exact video width and height
      if (lower.includes('vimeo.com')) {
        fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`)
          .then(res => res.json())
          .then(data => {
            if (data && data.width && data.height) {
              resolve({ width: data.width, height: data.height, aspect: data.width / data.height });
            } else {
              resolve(null);
            }
          })
          .catch(() => resolve(null));
        return;
      }

      // HTML5 Video natural aspect ratio
      const video = document.createElement('video');
      video.onloadedmetadata = () => {
        if (video.videoWidth && video.videoHeight) {
          resolve({ width: video.videoWidth, height: video.videoHeight, aspect: video.videoWidth / video.videoHeight });
        } else {
          resolve(null);
        }
      };
      video.onerror = () => resolve(null);
      video.src = url;
    });
  };

  const handleCancelPreview = () => {
    setIsPreviewLoaded(false);
    setErrorMsg('');
  };

  const handleAddToPage = async () => {
    if (!url.trim()) return;
    const rawUrl = url.trim();
    const type = detectMediaType(rawUrl);

    if (type === 'video') {
      const finalVideoUrl = getEmbedVideoUrl(rawUrl);
      const dimensions = await getVideoOriginalDimensions(rawUrl);
      
      const lower = rawUrl.toLowerCase();
      const isPortrait = (dimensions && dimensions.height > dimensions.width) || lower.includes('shorts') || lower.includes('reel') || lower.includes('tiktok') || lower.includes('portrait') || lower.includes('vertical');

      window.dispatchEvent(new CustomEvent('upload-video-to-editor', {
        detail: { 
          videoUrl: finalVideoUrl, 
          originalUrl: rawUrl, 
          pageIndex: activePageIndex,
          videoWidth: dimensions?.width,
          videoHeight: dimensions?.height,
          isPortrait: isPortrait
        }
      }));
    } else {
      window.dispatchEvent(new CustomEvent('upload-image-to-editor', {
        detail: { 
          dataUrl: rawUrl, 
          pageIndex: activePageIndex,
          dataType: type === 'pdf' ? 'pdf' : (rawUrl.endsWith('.gif') ? 'gif' : 'image')
        }
      }));
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/20 backdrop-blur-[2px] animate-in fade-in duration-200">
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
      />

      <div className="bg-white w-[90%] max-w-[34vw] rounded-[1vw] shadow-2xl overflow-hidden p-[1.5vw] flex flex-col gap-[1.1vw] border border-gray-100 relative z-10 animate-in zoom-in-95 duration-200">
        
        {/* Header Section */}
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center flex-1 gap-[0.8vw]">
              <h2 className="text-[1.25vw] font-bold text-gray-900 tracking-tight whitespace-nowrap">
                Import via URL
              </h2>
              <div className="h-[1px] bg-gray-200 flex-1"></div>
            </div>
            
            <button
              onClick={onClose}
              className="w-[2vw] h-[2vw] flex items-center justify-center bg-white border border-[#EF4444] hover:bg-red-50 text-[#EF4444] rounded-[0.4vw] transition-colors cursor-pointer flex-shrink-0 ml-[0.8vw]"
              title="Close"
            >
              <X size="1.1vw" strokeWidth={2.5} />
            </button>
          </div>
          <p className="text-[0.75vw] text-gray-400 font-normal mt-[0.3vw]">
            Paste a direct link to import images, PDFs or videos from the web.
          </p>
        </div>

        {/* Media Preview Box (Screenshot 2 state) */}
        {isPreviewLoaded && (
          <div className="w-full h-[15vw] max-h-[16vw] bg-[#1a1a1a] rounded-[0.8vw] flex items-center justify-center overflow-hidden border border-gray-200 relative group animate-in fade-in duration-200">
            {mediaType === 'image' && (
              <img 
                src={url} 
                alt="Preview" 
                className="max-w-full max-h-full object-contain"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = 'none';
                  setErrorMsg('Could not render image preview directly, but you can still add it to page.');
                }}
              />
            )}
            {mediaType === 'video' && (
              url.includes('youtube') || url.includes('youtu.be') || url.includes('vimeo') || url.includes('embed') ? (
                <iframe 
                  src={getEmbedVideoUrl(url)} 
                  className="w-full h-full object-cover pointer-events-none" 
                  title="Video Preview"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              ) : (
                <video src={url} controls className="max-w-full max-h-full object-contain" />
              )
            )}
            {mediaType === 'pdf' && (
              <div className="flex flex-col items-center gap-[0.5vw] text-white">
                <FileText size="3vw" className="text-red-400" />
                <span className="text-[0.8vw] font-medium">PDF Document Ready</span>
              </div>
            )}
            {errorMsg && (
              <div className="absolute inset-0 bg-black/80 p-[1vw] flex items-center justify-center text-center text-gray-300 text-[0.75vw]">
                {errorMsg}
              </div>
            )}
          </div>
        )}

        {/* Input Section */}
        <div>
          <label className="block text-[0.85vw] font-bold text-gray-900 mb-[0.35vw]">
            Paste URL
          </label>
          
          <div className="relative flex items-center w-full bg-white border border-gray-300 rounded-[0.5vw] px-[0.8vw] py-[0.6vw] shadow-sm focus-within:border-black transition-colors">
            <Link size="1.1vw" className="text-[#3195ff] flex-shrink-0 mr-[0.5vw]" />
            <input
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (isPreviewLoaded) setIsPreviewLoaded(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (!isPreviewLoaded) handleGetPreview();
                  else handleAddToPage();
                }
              }}
              placeholder="https://example.com/your-file.jpg"
              className="w-full bg-transparent outline-none text-[0.85vw] text-gray-800 placeholder-gray-400 font-normal"
            />
          </div>

          <p className="text-[0.72vw] text-gray-400 font-normal mt-[0.35vw]">
            Make sure the link is direct and publicly accessible.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-[0.75vw] mt-[0.3vw]">
          {!isPreviewLoaded ? (
            <>
              {/* Initial State: Close & Get Preview */}
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-[0.65vw] bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-semibold text-[0.85vw] rounded-[0.5vw] transition-colors cursor-pointer"
              >
                Close
              </button>

              <button
                type="button"
                onClick={handleGetPreview}
                disabled={!url.trim() || isLoading}
                className="flex-1 py-[0.65vw] bg-black hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold text-[0.85vw] rounded-[0.5vw] transition-colors cursor-pointer flex items-center justify-center gap-[0.4vw]"
              >
                {isLoading ? (
                  <>
                    <Loader2 size="1vw" className="animate-spin" />
                    <span>Loading...</span>
                  </>
                ) : (
                  <span>Get Preview</span>
                )}
              </button>
            </>
          ) : (
            <>
              {/* Preview State: Cancel & Add to Page */}
              <button
                type="button"
                onClick={handleCancelPreview}
                className="flex-1 py-[0.65vw] bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-semibold text-[0.85vw] rounded-[0.75vw] transition-colors cursor-pointer flex items-center justify-center gap-[0.4vw]"
              >
                <X size="1vw" />
                <span>Cancel</span>
              </button>

              <button
                type="button"
                onClick={handleAddToPage}
                className="flex-1 py-[0.65vw] bg-black hover:bg-gray-800 text-white font-semibold text-[0.85vw] rounded-[0.75vw] transition-colors cursor-pointer flex items-center justify-center gap-[0.4vw]"
              >
                <Check size="1vw" />
                <span>Add to Page</span>
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
};

export default ImportViaUrlModal;
