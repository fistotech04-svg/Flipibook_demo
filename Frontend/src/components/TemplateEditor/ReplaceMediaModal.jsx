import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@iconify/react';
import axios from 'axios';
import { resolveUploadsPath } from '../../utils/supabaseUtils';
import { checkIsAnimatedWebp } from './editorUtils';
import { useToast } from '../CustomToast';

const ReplaceMediaModal = ({ show, onClose, onReplace, mediaType = 'image', titleText, buttonText }) => {
  const toast = useToast();
  const [replaceModalTab, setReplaceModalTab] = useState('Upload');
  const [replaceModalFile, setReplaceModalFile] = useState(null);
  const [galleryAssets, setGalleryAssets] = useState([]);
  const [importUrl, setImportUrl] = useState('');
  const [importUrlError, setImportUrlError] = useState('');
  const [replaceModalFileDim, setReplaceModalFileDim] = useState('');
  const [activeGalleryDropdown, setActiveGalleryDropdown] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);

  const fileInputRefUpload = useRef(null);
  const fileInputRefGallery = useRef(null);
  const fileInputRefReplaceItem = useRef(null);
  const sortDropdownRef = useRef(null);
  const [itemToReplaceId, setItemToReplaceId] = useState(null);
  const [renamingItemId, setRenamingItemId] = useState(null);
  const [renameInput, setRenameInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const validateMediaFile = async (file) => {
    if (mediaType === 'video') return file.type.startsWith('video/');
    if (mediaType === 'gif') {
      if (file.type.includes('gif')) return true;
      if (file.type.includes('webp')) return await checkIsAnimatedWebp(file);
      return false;
    }
    if (mediaType === 'image') {
      if (file.type.startsWith('video/')) return false;
      if (file.type.includes('gif')) return false;
      if (file.type.includes('webp')) {
        const isAnimated = await checkIsAnimatedWebp(file);
        return !isAnimated;
      }
      return true;
    }
    return true;
  };

  const handleUploadFile = async (file) => {
    if (!file) return;
    if (await validateMediaFile(file)) {
      setReplaceModalFile(file);
    } else {
      alert(mediaType === 'gif' ? 'Please upload a GIF or animated WebP file.' : mediaType === 'image' ? 'Please upload a static image (not animated WebP or GIF).' : 'Please upload a valid video file.');
    }
  };

  const handleGalleryFiles = async (files) => {
    const validFiles = [];
    for (const f of files) {
      if (await validateMediaFile(f)) validFiles.push(f);
    }
    if (validFiles.length !== files.length) {
      alert(`Some files were ignored because they are not valid ${mediaType}s.`);
    }
    if (validFiles.length > 0) {
      setIsUploading(true);
      const storedUser = localStorage.getItem('user');
      const user = storedUser ? JSON.parse(storedUser) : null;
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

      const uploadPromises = validFiles.map(async (newFile) => {
        const tempUrl = URL.createObjectURL(newFile);
        const tempAsset = {
          id: tempUrl,
          name: newFile.name.replace(/\.[^/.]+$/, ''),
          url: tempUrl,
          isLocal: true,
          file: newFile,
          uploadedAt: new Date().toISOString()
        };

        if (user) {
          try {
            const formData = new FormData();
            formData.append('emailId', user.emailId);
            formData.append('isGallery', 'true');
            formData.append('type', mediaType);
            formData.append('file', newFile);
            formData.append('page_v_id', 'global');

            const res = await axios.post(`${backendUrl}/api/flipbook/upload-asset`, formData);
            if (res.data.url) {
              const serverUrl = resolveUploadsPath(res.data.url);
              return {
                ...tempAsset,
                id: res.data.file_v_id || tempUrl,
                url: serverUrl,
                rawUrl: res.data.url,
                file_v_id: res.data.file_v_id,
                isLocal: false,
                uploadedAt: new Date().toISOString()
              };
            }
          } catch (err) {
            console.error('Failed to upload asset to global gallery:', err);
          }
        }
        return tempAsset;
      });

      const uploadedNewAssets = await Promise.all(uploadPromises);
      setGalleryAssets(prev => [...uploadedNewAssets, ...prev]);
      setIsUploading(false);
    }
  };

  useEffect(() => {
    if (replaceModalFile) {
      const src = replaceModalFile.url || URL.createObjectURL(replaceModalFile);
      const img = new Image();
      img.onload = () => {
        setReplaceModalFileDim(`${img.width} x ${img.height}`);
        if (!replaceModalFile.url) URL.revokeObjectURL(src);
      };
      img.onerror = () => {
        setReplaceModalFileDim('Unknown');
        if (!replaceModalFile.url) URL.revokeObjectURL(src);
      };
      img.src = src;
    } else {
      setReplaceModalFileDim('');
    }
  }, [replaceModalFile]);

  useEffect(() => {
    const galleryTabName = mediaType === 'video' ? 'Video Gallery' : mediaType === 'gif' ? 'GIF Gallery' : 'Image Gallery';
    if (show && (replaceModalTab === galleryTabName || replaceModalTab === 'Upload' || galleryAssets.length === 0)) {
      const fetchAssets = async () => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) return;
        const user = JSON.parse(storedUser);
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
        try {
          const res = await axios.get(`${backendUrl}/api/flipbook/get-gallery-assets`, {
            params: { emailId: user.emailId, type: mediaType }
          });
          if (res.data.assets) {
            setGalleryAssets(res.data.assets.map(asset => ({
              id: asset.id || asset.name,
              name: (asset.name || 'Asset').replace(/\.[^/.]+$/, ''),
              url: resolveUploadsPath(asset.url),
              rawUrl: asset.url,
              uploadedAt: asset.uploadedAt || asset.created_at || new Date().toISOString()
            })));
          }
        } catch (err) {
          console.error(err);
        }
      };
      fetchAssets();
    }
  }, [show, replaceModalTab, mediaType]);

  const handleRenameSubmit = async (item) => {
    if (!renameInput.trim() || renameInput === item.name) {
      setRenamingItemId(null);
      return;
    }
    
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      
      try {
        const res = await axios.post(`${backendUrl}/api/flipbook/rename-gallery-asset`, {
          emailId: user.emailId,
          file_v_id: item.file_v_id,
          fileName: item.id || item.name,
          newName: renameInput.trim()
        });
        
        if (res.data.success) {
          setGalleryAssets(prev => prev.map(g => g.id === item.id ? { ...g, name: res.data.name } : g));
          if (replaceModalFile?.id === item.id) {
            setReplaceModalFile(prev => ({ ...prev, name: res.data.name }));
          }
          toast.success("Renamed successfully");
        }
      } catch (err) {
        console.error('Failed to rename asset:', err);
        toast.error("Failed to rename asset");
      }
    }
    setRenamingItemId(null);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target)) {
        setIsSortDropdownOpen(false);
      }
    };
    if (isSortDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSortDropdownOpen]);

  const filteredAssets = React.useMemo(() => {
    let result = [...galleryAssets];
    
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(asset => asset.name.toLowerCase().includes(lowerQuery));
    }
    
    result.sort((a, b) => {
      const timeA = new Date(a.uploadedAt || 0).getTime();
      const timeB = new Date(b.uploadedAt || 0).getTime();
      return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
    });
    
    return result;
  }, [galleryAssets, searchQuery, sortOrder]);

  if (!show) return null;

  const executeConfirmReplace = async (itemToConfirm) => {
    const targetFile = itemToConfirm || replaceModalFile;
    if (!targetFile) return;

    if (targetFile.isGalleryItem || targetFile.isUrl) {
      try {
        if (mediaType === 'video' && targetFile.isUrl) {
          const mockFile = new File([""], targetFile.name + '.mp4', { type: 'video/mp4' });
          mockFile.url = targetFile.url;
          mockFile.isUrl = true;
          mockFile.isYouTube = targetFile.isYouTube;
          onReplace(mockFile);
        } else {
          const response = await fetch(targetFile.url);
          const blob = await response.blob();
          const ext = mediaType === 'video' ? '.mp4' : mediaType === 'gif' ? (blob.type === 'image/webp' || targetFile.url?.toLowerCase().includes('.webp') ? '.webp' : '.gif') : '.png';
          const mimeType = blob.type || (mediaType === 'video' ? 'video/mp4' : mediaType === 'gif' ? (ext === '.webp' ? 'image/webp' : 'image/gif') : 'image/png');
          const file = new File([blob], targetFile.name + ext, { type: mimeType });
          onReplace(file);
        }
      } catch (e) {
        console.error("Failed to fetch media", e);
        if (targetFile.isUrl) {
          alert(`Could not load ${mediaType} from this URL. Make sure it's a direct link and allows cross-origin access.`);
        }
      }
    } else {
      onReplace(targetFile);
    }
    onClose();
    setReplaceModalFile(null);
    setImportUrl('');
    setImportUrlError('');
  };

  return createPortal(
    <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-[2vw]" onClick={(e) => {
        if (!e.target.closest('.rename-input')) {
          setRenamingItemId(null);
        }
        onClose();
      }}>
      <div className="bg-white rounded-[0.8vw] w-[400px] shadow-xl flex flex-col font-sans relative" onClick={(e) => {
        e.stopPropagation();
        if (!e.target.closest('.rename-input')) {
          setRenamingItemId(null);
        }
      }}>
        {/* Header */}
        <div className="flex items-center justify-between p-[1.5vw] pb-[0.5vw]">
          <h2 className="text-[1.1vw] font-bold text-gray-900 mr-[1vw]">
            {titleText || (mediaType === 'video' ? 'Replace Video' : mediaType === 'gif' ? 'Replace Gif' : 'Replace Image')}
          </h2>
          <div className="flex-1 h-px bg-gray-200 mx-[0.5vw]"></div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <Icon icon="lucide:x" className="w-[1vw] h-[1vw]" />
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex w-full px-[1.5vw] border-b border-gray-100">
          {['Upload', mediaType === 'video' ? 'Video Gallery' : mediaType === 'gif' ? 'GIF Gallery' : 'Image Gallery', 'Import via URL'].map(tab => (
            <button 
              key={tab} 
              onClick={() => setReplaceModalTab(tab)}
              className={`flex-1 text-center py-[0.5vw] text-[0.8vw] font-medium border-b-[0.15vw] transition-colors ${replaceModalTab === tab ? 'border-gray-800 text-gray-800' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content area */}
        <div className="px-[1.5vw] pb-[1.5vw] pt-[0.5vw] h-[20vw] flex flex-col">
          {replaceModalTab === 'Upload' && (
            <>
              {(replaceModalFile && !replaceModalFile.isUrl && !replaceModalFile.isGalleryItem) ? (
                <div className="flex-1 flex flex-col min-h-0 w-[95%] mx-auto mt-[0.5vw]">
                  <div className="w-full aspect-video relative overflow-hidden bg-gray-100 group flex items-center justify-center shrink-0">
                    {mediaType === 'video' ? (
                      <video src={replaceModalFile.url || URL.createObjectURL(replaceModalFile)} className="w-full h-full object-contain" controls />
                    ) : (
                      <img src={replaceModalFile.url || URL.createObjectURL(replaceModalFile)} alt="Preview" className="w-full h-full object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
                    )}
                    <span className="absolute top-[0.5vw] left-[0.5vw] text-white text-[0.75vw] font-medium drop-shadow-md">Preview</span>
                    <button onClick={() => setReplaceModalFile(null)} className="absolute top-[0.5vw] right-[0.5vw] text-white p-[0.3vw] rounded-[0.3vw] transition-colors drop-shadow-md hover:bg-black/20">
                      <Icon icon="lucide:trash-2" className="w-[1vw] h-[1vw]" />
                    </button>
                  </div>
                  <div className="mt-[0.5vw] mb-[0.2vw] flex flex-col gap-[0.2vw] text-[0.7vw] text-gray-500 shrink-0">
                    <p>File Name : {replaceModalFile.name || 'Sample file.jpg'}</p>
                    <p>Dimension : {replaceModalFileDim || 'Loading...'}</p>
                    <p>File size : {replaceModalFile.size ? (replaceModalFile.size / 1024).toFixed(0) + 'KB' : 'Unknown'}</p>
                  </div>
                </div>
              ) : (
                <>
                  <div 
                    className="flex-1 mt-[1vw] w-[92%] mx-auto border-2 border-dashed border-gray-400/70 rounded-[1vw] bg-[#F8F9FA] flex flex-col items-center justify-center py-[1vw] px-[2vw] text-center cursor-pointer transition-colors hover:bg-gray-100"
                    onClick={() => fileInputRefUpload.current?.click()}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => {
                      e.preventDefault();
                      if (e.dataTransfer.files?.length) {
                        handleUploadFile(e.dataTransfer.files[0]);
                      }
                    }}
                  >
                    <div className="flex flex-col items-center justify-center w-full">
                      <Icon icon="lucide:upload" className="w-[2vw] h-[2vw] text-gray-400 mb-[0.3vw] stroke-[1.5]" />
                      <span className="text-[0.9vw] text-gray-400 font-medium mb-[0.1vw]">Drag & Drop File here</span>
                      <span className="text-[0.75vw] text-gray-400 mb-[0.3vw]">or</span>
                      <div className="bg-[#4D47FF] hover:bg-[#3D38CC] rounded-[0.4vw] p-[0.1vw] shadow-sm transition-colors cursor-pointer inline-block">
                        <div 
                          className="flex items-center justify-center gap-[0.3vw] cursor-pointer text-white text-[0.7vw] font-medium px-[0.6vw] py-[0.3vw] rounded-[0.3vw]"
                          onClick={(e) => { e.stopPropagation(); fileInputRefUpload.current?.click(); }}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (e.dataTransfer.files?.length) {
                              handleUploadFile(e.dataTransfer.files[0]);
                            }
                          }}
                        >
                          <Icon icon="lucide:upload" className="w-[0.8vw] h-[0.8vw] stroke-[2]" />
                          Browse Files
                          <input type="file" ref={fileInputRefUpload} className="hidden" accept={mediaType === 'video' ? 'video/mp4' : 'image/*'} onChange={e => {
                            if (e.target.files?.length) handleUploadFile(e.target.files[0]);
                          }} onClick={(e) => { e.target.value = null; }} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-[1.5vw] text-[0.8vw] text-gray-500 space-y-[0.2vw] shrink-0">
                    <p>Supported File : {mediaType === 'video' ? 'MP4, MKV, WEBM' : mediaType === 'gif' ? 'GIF, WEBP' : 'JPG, PNG, WEBP, SVG'}</p>
                    <p>Max file size : 50MB</p>
                  </div>
                </>
              )}
            </>
          )}
          {replaceModalTab === (mediaType === 'video' ? 'Video Gallery' : mediaType === 'gif' ? 'GIF Gallery' : 'Image Gallery') && (
            <div className="flex flex-col flex-1 min-h-0" onClick={() => setActiveGalleryDropdown(null)}>
              {/* Toolbar */}
              <div className="flex flex-col gap-[0.75vw] mt-[1vw] mb-[1vw] shrink-0">
                {/* Search and Sort Row */}
                <div className="flex items-center justify-between gap-[0.5vw]">
                  {/* Search */}
                  <div className="flex-1 relative">
                    <Icon icon="lucide:search" className="absolute left-[0.5vw] top-1/2 -translate-y-1/2 w-[0.8vw] h-[0.8vw] text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Search media..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-[1.8vw] pr-[0.5vw] py-[0.3vw] text-[0.75vw] border border-gray-200 rounded-[0.5vw] outline-none focus:border-[#4D47FF]"
                    />
                  </div>
                  {/* Sort Dropdown */}
                  <div className="relative inline-block cursor-pointer shrink-0" ref={sortDropdownRef}>
                    <div 
                      className="flex items-center justify-between gap-[0.3vw] w-[6.5vw] bg-white border border-gray-200 rounded-[0.4vw] px-[0.55vw] py-[0.3vw] shadow-sm hover:bg-gray-50 transition-colors"
                      onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                    >
                      <Icon icon="lucide:arrow-up-down" className="w-[0.75vw] h-[0.75vw] text-gray-500" />
                      <span className="text-[0.7vw] font-medium ml-[-0.8vw] text-gray-700 truncate flex-1 text-center">{sortOrder === 'desc' ? 'Newest' : 'Oldest'}</span>
                      <Icon icon="lucide:chevron-down" className="w-[0.75vw] h-[0.75vw] text-gray-500 shrink-0" />
                    </div>
                    
                    {isSortDropdownOpen && (
                      <div className="absolute top-full right-0 mt-[0.2vw] w-full bg-white border border-gray-200 rounded-[0.4vw] shadow-lg z-50 overflow-hidden">
                        {['Newest', 'Oldest'].map(option => (
                          <div 
                            key={option}
                            className={`px-[0.55vw] py-[0.45vw] text-[0.7vw] font-medium cursor-pointer transition-colors ${
                              (sortOrder === 'desc' && option === 'Newest') || (sortOrder === 'asc' && option === 'Oldest') 
                                ? 'bg-[#F3F4F6] text-gray-900' : 'text-gray-700 hover:bg-gray-50'
                            }`}
                            onClick={() => {
                              setSortOrder(option === 'Newest' ? 'desc' : 'asc');
                              setIsSortDropdownOpen(false);
                            }}
                          >
                            {option}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <h3 className="text-[0.85vw] font-semibold text-gray-800">{mediaType === 'video' ? 'Video Gallery' : mediaType === 'gif' ? 'GIF Gallery' : 'Image Gallery'}</h3>
                  <div className="bg-[#4D47FF] hover:bg-[#3D38CC] rounded-[0.4vw] p-[0.15vw] shadow-sm transition-colors cursor-pointer inline-block">
                    <div 
                      className="flex items-center justify-center gap-[0.5vw] cursor-pointer text-white px-[0.85vw] py-[0.25vw] rounded-[0.3vw] border-[1.5px] border-dashed border-white"
                      onClick={() => fileInputRefGallery.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (e.dataTransfer.files?.length) {
                          handleGalleryFiles(Array.from(e.dataTransfer.files));
                        }
                      }}
                    >
                      <Icon icon="lucide:upload" className="w-[1vw] h-[1vw] stroke-[2]" />
                      <span className="text-[0.85vw] font-medium">Browse Files</span>
                      <input type="file" ref={fileInputRefGallery} className="hidden" accept={mediaType === 'video' ? 'video/mp4' : 'image/*'} multiple onChange={e => {
                        if (e.target.files?.length) {
                          handleGalleryFiles(Array.from(e.target.files));
                        }
                      }} onClick={(e) => { e.target.value = null; }} />
                    </div>
                  </div>
                </div>
              </div>
              <input type="file" ref={fileInputRefReplaceItem} className="hidden" accept={mediaType === 'video' ? 'video/mp4' : 'image/*'} onChange={async e => {
                if (e.target.files?.length && itemToReplaceId) {
                  const newFile = e.target.files[0];
                  if (!(await validateMediaFile(newFile))) {
                    alert(mediaType === 'gif' ? 'Please upload a GIF or animated WebP file.' : mediaType === 'image' ? 'Please upload a static image (not animated WebP or GIF).' : 'Please upload a valid video file.');
                    return;
                  }
                  const newUrl = URL.createObjectURL(newFile);
                  const existingAsset = galleryAssets.find(g => g.id === itemToReplaceId);
                  let updatedAsset = {
                    id: newUrl,
                    name: newFile.name.replace(/\.[^/.]+$/, ''),
                    url: newUrl,
                    isLocal: true,
                    file: newFile
                  };

                  const storedUser = localStorage.getItem('user');
                  if (storedUser) {
                    const user = JSON.parse(storedUser);
                    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
                    const formData = new FormData();
                    formData.append('emailId', user.emailId);
                    formData.append('isGallery', 'true');
                    formData.append('type', mediaType);
                    formData.append('file', newFile);
                    formData.append('page_v_id', 'global');
                    if (existingAsset?.rawUrl || existingAsset?.url) {
                      formData.append('replacing_file_url', existingAsset.rawUrl || existingAsset.url);
                    }

                    try {
                      const res = await axios.post(`${backendUrl}/api/flipbook/upload-asset`, formData);
                      if (res.data.url) {
                        const serverUrl = resolveUploadsPath(res.data.url);
                        updatedAsset = {
                          ...updatedAsset,
                          id: res.data.file_v_id || newUrl,
                          url: serverUrl,
                          rawUrl: res.data.url,
                          file_v_id: res.data.file_v_id,
                          isLocal: false
                        };
                      }
                    } catch (err) {
                      console.error('Failed to replace gallery asset:', err);
                    }
                  }

                  setGalleryAssets(prev => prev.map(g => g.id === itemToReplaceId ? updatedAsset : g));

                  if (replaceModalFile?.id === itemToReplaceId) {
                    setReplaceModalFile({ ...updatedAsset, isGalleryItem: true });
                  }
                  setItemToReplaceId(null);
                }
              }} onClick={(e) => { e.target.value = null; }} />

              {/* Grid */}
              <div className="flex-1 overflow-y-auto overscroll-contain min-h-0 pr-[0.5vw] will-change-scroll" onClick={() => setReplaceModalFile(null)}>
                {isUploading ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-[0.5vw]">
                    <Icon icon="lucide:loader-2" className="w-[2vw] h-[2vw] animate-spin text-[#4D47FF]" />
                    <span className="text-[0.8vw] font-medium">Uploading media...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-[1vw]">
                {filteredAssets.length > 0 ? filteredAssets.map((item, idx) => (
                  <div key={item.id || idx} className="flex flex-col gap-[0.4vw] relative">
                    <div 
                      className={`group cursor-pointer w-full aspect-square rounded-[0.4vw] overflow-hidden bg-gray-100 relative shadow-sm ${replaceModalFile?.id === item.id ? 'border-[0.15vw] border-[#4D47FF]' : 'border border-gray-200 group-hover:shadow-md'}`}
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        if (renamingItemId === item.id) return;
                        replaceModalFile?.id === item.id ? setReplaceModalFile(null) : setReplaceModalFile({ ...item, isGalleryItem: true }); 
                        setActiveGalleryDropdown(null); 
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        const selectedItem = { ...item, isGalleryItem: true };
                        setReplaceModalFile(selectedItem);
                        setTimeout(() => executeConfirmReplace(selectedItem), 50);
                      }}
                    >
                      {mediaType === 'video' ? (
                        <video src={item.url} className="w-full h-full object-cover" />
                      ) : (
                        <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                      )}
                      <div className={`absolute inset-0 bg-black/0 ${replaceModalFile?.id === item.id ? '' : 'group-hover:bg-black/5'}`} />
                      
                      {/* Hover Three Dots */}
                      <div 
                        className={`absolute top-[0.3vw] right-[0.3vw] bg-white/90 rounded-[0.2vw] p-[0.2vw] shadow-sm hover:bg-white z-10 ${activeGalleryDropdown === item.id ? 'block' : 'hidden group-hover:block'}`}
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setActiveGalleryDropdown(activeGalleryDropdown === item.id ? null : item.id); 
                        }}
                      >
                        <Icon icon="lucide:more-vertical" className="w-[0.9vw] h-[0.9vw] text-gray-700" />
                      </div>
                    </div>

                    {/* Dropdown Menu */}
                    {activeGalleryDropdown === item.id && (
                      <div className={`absolute top-[1.5vw] ${idx % 4 < 2 ? 'left-0' : 'right-0'} bg-white rounded-[0.3vw] shadow-lg border border-gray-200 py-[0.2vw] w-[6vw] z-20 flex flex-col overflow-hidden`}>
                        <button 
                          className="text-[0.7vw] font-medium text-gray-700 hover:bg-gray-50 text-left px-[0.5vw] py-[0.3vw]"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRenamingItemId(item.id);
                            setRenameInput(item.name);
                            setActiveGalleryDropdown(null);
                          }}
                        >
                          Rename
                        </button>
                        <button 
                          className="text-[0.7vw] font-medium text-gray-700 hover:bg-gray-50 text-left px-[0.5vw] py-[0.3vw]"
                          onClick={(e) => {
                            e.stopPropagation();
                            setItemToReplaceId(item.id);
                            fileInputRefReplaceItem.current?.click();
                            setActiveGalleryDropdown(null);
                          }}
                        >
                          Replace {mediaType === 'video' ? 'Video' : mediaType === 'gif' ? 'Gif' : 'Image'}
                        </button>
                        <button 
                          className="text-[0.7vw] font-medium text-red-600 hover:bg-red-50 text-left px-[0.5vw] py-[0.3vw]"
                          onClick={async (e) => {
                            e.stopPropagation();
                            const storedUser = localStorage.getItem('user');
                            if (storedUser) {
                              const user = JSON.parse(storedUser);
                              const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
                              try {
                                await axios.post(`${backendUrl}/api/flipbook/delete-gallery-asset`, {
                                  emailId: user.emailId,
                                  url: item.rawUrl || item.url,
                                  fileName: item.id || item.name,
                                  file_v_id: item.file_v_id
                                });
                                toast.error("Deleted successfully");
                              } catch (err) {
                                console.error('Failed to delete gallery asset:', err);
                                toast.error("Failed to delete asset");
                              }
                            }
                            setGalleryAssets(prev => prev.filter(g => g.id !== item.id));
                            if (replaceModalFile?.id === item.id) {
                              setReplaceModalFile(null);
                            }
                            setActiveGalleryDropdown(null);
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                    
                    {renamingItemId === item.id ? (
                      <input
                        type="text"
                        autoFocus
                        value={renameInput}
                        onChange={(e) => setRenameInput(e.target.value)}
                        onBlur={() => handleRenameSubmit(item)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleRenameSubmit(item);
                          } else if (e.key === 'Escape') {
                            setRenamingItemId(null);
                          }
                        }}
                        className="rename-input text-center text-[0.7vw] font-medium text-gray-900 border border-[#4D47FF] rounded-[0.2vw] px-[0.2vw] py-0 outline-none w-full"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span className="text-center text-[0.7vw] font-medium text-gray-500 truncate w-full px-[0.2vw]">{item.name}</span>
                    )}
                  </div>
                )) : (
                  <div className="col-span-4 flex items-center justify-center text-center text-gray-400 py-[2vw] text-[0.8vw]">
                    No {mediaType === 'video' ? 'videos' : mediaType === 'gif' ? 'gifs' : 'images'} found in your gallery.
                  </div>
                )}
                </div>
                )}
              </div>
            </div>
          )}
          {replaceModalTab === 'Import via URL' && (
            <div className="flex-1 flex flex-col min-h-0 w-[95%] mx-auto mt-[0.5vw]">
                  <div className="w-full aspect-video relative overflow-hidden bg-gray-100 group flex items-center justify-center shrink-0">
                    {replaceModalFile?.url ? (
                      <>
                        {mediaType === 'video' ? (
                          replaceModalFile.isYouTube ? (
                            <iframe 
                              src={replaceModalFile.ytVideoId ? `https://www.youtube.com/embed/${replaceModalFile.ytVideoId}` : (replaceModalFile.url.includes('watch?v=') ? replaceModalFile.url.replace('watch?v=', 'embed/') : replaceModalFile.url)} 
                              className="w-full h-full object-contain absolute inset-0 z-10 bg-gray-100" 
                              frameBorder="0" 
                              allowFullScreen
                            />
                          ) : (
                            <video 
                              src={replaceModalFile.url} 
                              className="w-full h-full object-contain absolute inset-0 z-10 bg-gray-100" 
                              controls
                              onError={(e) => { e.target.style.display = 'none'; if (e.target.nextSibling) { e.target.nextSibling.style.display = 'block'; e.target.nextSibling.innerText = 'Failed to load preview'; } }}
                            />
                          )
                        ) : (
                          <img 
                            src={replaceModalFile.url} 
                            alt="Preview" 
                            className="w-full h-full object-contain absolute inset-0 z-10 bg-gray-100" 
                            onError={(e) => { 
                              if (e.target.src.includes('maxresdefault.jpg')) {
                                e.target.src = e.target.src.replace('maxresdefault.jpg', 'hqdefault.jpg');
                                if (replaceModalFile) replaceModalFile.url = e.target.src;
                              } else {
                                e.target.style.display = 'none'; 
                                if (e.target.nextSibling) {
                                  e.target.nextSibling.style.display = 'block'; 
                                  e.target.nextSibling.innerText = 'Failed to load preview';
                                }
                              }
                            }} 
                          />
                        )}
                        <span className="text-[0.85vw] text-gray-400 font-medium hidden relative z-0">Failed to load preview</span>
                      </>
                    ) : (
                      <span className="text-[0.85vw] text-gray-400 font-medium block">Preview</span>
                    )}
                  </div>
              <div className="mt-[0.5vw] flex flex-col gap-[0.4vw] shrink-0">
                <label className="text-[0.85vw] font-semibold text-gray-900">{mediaType === 'video' ? 'Paste Video URL' : mediaType === 'gif' ? 'Paste Gif URL' : 'Paste Image URL'}</label>
                <div className="flex items-center gap-[0.5vw] border border-gray-200 rounded-[0.5vw] px-[0.75vw] py-[0.5vw] bg-white">
                  <Icon icon="lucide:link" className="w-[1vw] h-[1vw] text-[#4D47FF]" />
                  <input 
                    type="text" 
                    placeholder="https://" 
                    className="flex-1 bg-transparent outline-none text-[0.85vw] text-gray-700 placeholder-gray-400"
                    value={importUrl}
                    onChange={(e) => {
                      const val = e.target.value;
                      setImportUrl(val);
                      if (val.trim()) {
                        let finalUrl = val.trim();
                        const ytMatch = finalUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
                        const isImage = /\.(jpeg|jpg|gif|png|webp|svg)(\?.*)?$/i.test(finalUrl);
                        const isVideo = ytMatch || /\.(mp4|webm|ogg|mkv)(\?.*)?$/i.test(finalUrl);

                        if (mediaType === 'video') {
                          if (ytMatch || isVideo) {
                            setImportUrlError('');
                            setReplaceModalFile({ url: finalUrl, name: 'url_video', isUrl: true, isYouTube: !!ytMatch, ytVideoId: ytMatch ? ytMatch[1] : null });
                          } else {
                            setImportUrlError('Please enter a valid video URL or YouTube link.');
                            setReplaceModalFile(null);
                          }
                        } else if (mediaType === 'gif') {
                          const isGif = /\.(gif|webp)(\?.*)?$/i.test(finalUrl);
                          if (!isGif) {
                            setImportUrlError('Please enter a valid GIF or WEBP URL.');
                            setReplaceModalFile(null);
                          } else {
                            setImportUrlError('');
                            setReplaceModalFile({ url: finalUrl, name: 'url_gif', isUrl: true });
                          }
                        } else {
                          if (ytMatch || isVideo) {
                            setImportUrlError('Video links are not supported here. Please enter an image URL.');
                            setReplaceModalFile(null);
                          } else {
                            setImportUrlError('');
                            setReplaceModalFile({ url: finalUrl, name: 'url_image', isUrl: true });
                          }
                        }
                      } else {
                        setImportUrlError('');
                        setReplaceModalFile(null);
                      }
                    }}
                  />
                </div>
                {importUrlError ? (
                  <span className="text-[0.7vw] text-red-500">{importUrlError}</span>
                ) : (
                  <span className="text-[0.7vw] text-gray-400">Make sure the link is direct and publicly accessible.</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-[0.75vw] p-[1.5vw] border-t border-gray-100">
          <button 
            onClick={() => { onClose(); setReplaceModalFile(null); setImportUrl(''); setImportUrlError(''); }}
            className="flex-1 py-[0.5vw] rounded-[0.3vw] border border-gray-200 text-gray-700 text-[0.8vw] font-medium hover:bg-gray-50 flex items-center justify-center gap-[0.5vw]"
          >
            <Icon icon="lucide:x" className="w-[0.8vw] h-[0.8vw]" /> Cancel
          </button>
          <button 
            disabled={!replaceModalFile}
            onClick={() => executeConfirmReplace()}
            className={`flex-1 py-[0.5vw] rounded-[0.3vw] text-white text-[0.8vw] font-medium transition-colors ${replaceModalFile ? 'bg-black hover:bg-gray-800' : 'bg-[#B1B1B1] cursor-not-allowed'}`}
          >
            {buttonText || `Replace ${mediaType === 'video' ? 'Video' : mediaType === 'gif' ? 'Gif' : 'Image'}`}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ReplaceMediaModal;
