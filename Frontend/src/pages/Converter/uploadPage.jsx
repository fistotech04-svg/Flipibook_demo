import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import initOCCT from 'occt-import-js';

// Pre-initialize OCCT WebAssembly instance while user is on upload screen
let preloadedOcct = null;
const warmUpOcct = () => {
  if (!preloadedOcct) {
    preloadedOcct = initOCCT({
      locateFile: () => '/occt-import-js.wasm'
    });
  }
  return preloadedOcct;
};

const UploadPage = ({ onBack, onContinue, initialConfig }) => {
  // Only display file preview when user uploads a file
  const [selectedFile, setSelectedFile] = useState(null);

  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Warm up 3D engine in background if in 3d-model mode
  useEffect(() => {
    if (initialConfig?.type === '3d-model') {
      warmUpOcct();
    }
  }, [initialConfig?.type]);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleFileChange = (file) => {
    if (!file) return;

    // Validate image format against allowed types (JPG, PNG, WEBP, AVIF, TIFF)
    if (initialConfig?.type === 'image') {
      const allowedExts = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'tiff', 'tif'];
      const fileExt = file.name ? file.name.split('.').pop().toLowerCase() : '';
      if (!allowedExts.includes(fileExt)) {
        alert(`Unsupported file format (.${fileExt}). Please upload a valid image format: JPG, PNG, WEBP, AVIF, or TIFF.`);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }
    }

    // Validate video format against allowed types (MP4, WEBM, MOV, GIF, AVI)
    if (initialConfig?.type === 'video') {
      const allowedVideoExts = ['mp4', 'webm', 'mov', 'gif', 'avi'];
      const fileExt = file.name ? file.name.split('.').pop().toLowerCase() : '';
      if (!allowedVideoExts.includes(fileExt)) {
        alert(`Unsupported file format (.${fileExt}). Please upload a valid video format: MP4, WEBM, MOV, GIF, or AVI.`);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }
    }

    // Immediately trigger warm-up if CAD file
    if (file.name && file.name.match(/\.(step|stp|iges|igs)$/i)) {
      warmUpOcct();
    }

    const previewUrl = URL.createObjectURL(file);
    const newFileState = {
      name: file.name,
      size: formatFileSize(file.size),
      resolution: '',
      previewUrl: previewUrl,
      rawFile: file,
      isDemo: false,
    };

    // If it's an image, calculate dimensions
    if (file.type.startsWith('image/')) {
      const img = new Image();
      img.onload = () => {
        newFileState.resolution = `${img.naturalWidth} x ${img.naturalHeight}`;
        setSelectedFile({ ...newFileState });
      };
      img.src = previewUrl;
    } else if (file.type.startsWith('video/')) {
      const video = document.createElement('video');
      video.onloadedmetadata = () => {
        newFileState.resolution = `${video.videoWidth} x ${video.videoHeight}`;
        setSelectedFile({ ...newFileState });
      };
      video.src = previewUrl;
    } else {
      newFileState.resolution = file.type || '3D Model';
      setSelectedFile(newFileState);
    }

    setSelectedFile(newFileState);
  };

  const onFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileChange(e.target.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveFile = (e) => {
    e.stopPropagation();
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleChooseFileClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  };

  const handleContinue = () => {
    if (!selectedFile) {
      alert('Please select or upload a file first.');
      return;
    }
    if (onContinue) {
      onContinue(selectedFile);
    }
  };

  // Accepted file types depending on converter mode
  const getAcceptTypes = () => {
    if (initialConfig?.type === 'video') return '.mp4,.webm,.mov,.gif,.avi,video/mp4,video/webm,video/quicktime,image/gif,video/x-msvideo';
    if (initialConfig?.type === '3d-model') return '.step,.stp,.iges,.igs,.stl,.obj,.glb,.gltf';
    if (initialConfig?.type === 'image') return '.jpg,.jpeg,.png,.webp,.avif,.tiff,.tif,image/jpeg,image/png,image/webp,image/avif,image/tiff';
    return '*/*';
  };

  return (
    <div className="w-full min-h-[calc(100vh-8vh)] bg-white flex flex-col items-center justify-start pt-12 pb-14 px-6 select-none">
      {/* Title & Subtitle */}
      <div className="text-center mb-8">
        <h1 className="text-[32px] md:text-[34px] font-bold text-[#1e293b] tracking-tight leading-tight">
          Upload Your File
        </h1>
        <p className="text-[15px] text-[#64748b] font-normal mt-2">
          Drag and drop your file here to get started.
        </p>
      </div>

      {/* Main Container - wide matching screenshot 1 */}
      <div className="w-[91%] max-w-[1300px] flex flex-col">
        {/* Dropzone Box */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`w-full rounded-[6px] border border-dashed ${
            isDragging ? 'border-[#EA7233] bg-[#fffaf6]' : 'border-[#CFCFCF] bg-[#F7FAFD]'
          } transition-all duration-200 py-14 flex flex-col items-center justify-center`}
        >
          {/* Cloud with Up Arrow Icon - ant-design:cloud-upload-outlined */}
          <div className="text-[#1e293b] mb-3 flex items-center justify-center">
            <Icon icon="ant-design:cloud-upload-outlined" className="w-12 h-12 text-[#1e293b]" />
          </div>

          {/* Drop text */}
          <p className="text-[17px] font-medium text-[#1e293b]">
            Drop your file here
          </p>

          {/* Divider with 'or' */}
          <div className="flex items-center justify-center w-[220px] my-3.5">
            <div className="flex-1 h-[1px] bg-[#E2E8F0]"></div>
            <span className="px-3 text-[13px] text-[#94a3b8] font-normal">or</span>
            <div className="flex-1 h-[1px] bg-[#E2E8F0]"></div>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept={getAcceptTypes()}
            onChange={onFileInputChange}
            className="hidden"
          />

          {/* Choose File Button */}
          <button
            type="button"
            onClick={handleChooseFileClick}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#EA7233] hover:bg-[#d86326] active:scale-98 text-white rounded-[6px] text-sm font-medium shadow-sm transition-all cursor-pointer"
          >
            {/* Folder Icon */}
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
            </svg>
            <span>Choose File</span>
          </button>

          {/* Supported Formats Indicator */}
          {initialConfig?.type === '3d-model' || initialConfig?.id === '3d-model' ? (
            <div className="mt-4 flex flex-col items-center gap-1.5 text-center">
              <span className="text-[12px] font-medium text-[#64748b]">
                Supported Formats:
              </span>
              <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-[500px]">
                {['STEP', 'STP', 'STL', 'OBJ', 'GLB', 'GLTF', 'IGES', 'IGS'].map((fmt) => (
                  <span
                    key={fmt}
                    className="px-2 py-0.5 rounded-[4px] text-[11px] font-semibold bg-[#e2e8f0]/60 text-[#334155] border border-[#cbd5e1]/50"
                  >
                    .{fmt.toLowerCase()}
                  </span>
                ))}
              </div>
            </div>
          ) : initialConfig?.type === 'video' || initialConfig?.id === 'video' ? (
            <div className="mt-4 flex flex-col items-center gap-1 text-center">
              <span className="text-[12px] text-[#64748b]">
                Supported Formats: <strong className="text-[#334155]">MP4, WEBM, MOV, GIF, AVI</strong>
              </span>
            </div>
          ) : (
            <div className="mt-4 flex flex-col items-center gap-1 text-center">
              <span className="text-[12px] text-[#64748b]">
                Supported Formats: <strong className="text-[#334155]">JPG, PNG, WEBP, AVIF, TIFF</strong>
              </span>
            </div>
          )}
        </div>

        {/* Selected File Card - wide matching dropzone width with #F6F9FD */}
        {selectedFile && (
          <div className="w-full mt-4 bg-[#F6F9FD] border border-[#F6F9FD] rounded-[6px] px-3.5 py-2.5 flex items-center justify-between transition-all">
            <div className="flex items-center gap-3.5 min-w-0">
              {/* Thumbnail Image / Video */}
              <div className="w-16 h-11 rounded-[4px] overflow-hidden bg-gray-900 flex-shrink-0 flex items-center justify-center border border-[#e2e8f0]">
                {selectedFile.rawFile?.type?.startsWith('video/') || selectedFile.name?.match(/\.(mp4|mov|avi|wmv|mkv|webm)$/i) ? (
                  <video
                    src={selectedFile.previewUrl}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                    preload="metadata"
                  />
                ) : selectedFile.name?.match(/\.(glb|gltf|obj|stl|ply)$/i) || initialConfig?.type === '3d-model' ? (
                  <div className="w-full h-full bg-[#fff5ee] flex items-center justify-center text-[#EA7233]">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                      <path d="m3.3 7 8.7 5 8.7-5" />
                      <path d="M12 22V12" />
                    </svg>
                  </div>
                ) : selectedFile.previewUrl ? (
                  <img
                    src={selectedFile.previewUrl}
                    alt={selectedFile.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Name & Meta info */}
              <div className="min-w-0 flex flex-col justify-center">
                <span className="text-[14px] font-semibold text-[#1e293b] truncate block leading-snug">
                  {selectedFile.name}
                </span>
                <span className="text-[12px] text-[#64748b] font-normal leading-tight mt-0.5">
                  {selectedFile.size}
                  {selectedFile.resolution ? ` • ${selectedFile.resolution}` : ''}
                </span>
              </div>
            </div>

            {/* Remove / Close Button */}
            <button
              type="button"
              onClick={handleRemoveFile}
              className="text-[#94a3b8] hover:text-[#1e293b] p-1.5 rounded hover:bg-black/5 transition-colors cursor-pointer mr-1"
              title="Remove file"
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
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}

        {/* Bottom Navigation Buttons */}
        <div className="w-full flex items-center justify-between mt-6">
          {/* Back Button */}
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-white border border-[#d1d5db] hover:bg-[#f8fafc] active:scale-98 rounded-[6px] text-sm font-medium text-[#1e293b] shadow-sm transition-all cursor-pointer"
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

          {/* Continue Button */}
          <button
            type="button"
            onClick={handleContinue}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#EA7233] hover:bg-[#d86326] active:scale-98 text-white rounded-[6px] text-sm font-medium shadow-sm transition-all cursor-pointer"
          >
            <span>Continue</span>
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
    </div>
  );
};

export default UploadPage;
