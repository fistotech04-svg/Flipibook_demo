import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@iconify/react';
import axios from 'axios';
import { checkIsAnimatedWebp } from './editorUtils';
import { resolveUploadsPath } from '../../utils/supabaseUtils';
import { useToast } from '../CustomToast';

const MediaGalleryPopup = ({ isOpen, onClose, anchorRef, onFileSelect, initialGalleryType, imageOnly = false }) => {
  const toast = useToast();
  const [galleryType, setGalleryType] = useState(() => {
    return initialGalleryType || (imageOnly ? 'Image Gallery' : 'All');
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [galleryAssets, setGalleryAssets] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [activeGalleryDropdown, setActiveGalleryDropdown] = useState(null);
  const [itemToReplaceId, setItemToReplaceId] = useState(null);
  const [renamingItemId, setRenamingItemId] = useState(null);
  const [renameInput, setRenameInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const fileInputRef = useRef(null);
  const fileInputRefReplaceItem = useRef(null);
  const dropdownRef = useRef(null);
  const sortDropdownRef = useRef(null);
  const popupRef = useRef(null);

  useEffect(() => {
    if (initialGalleryType) {
      setGalleryType(initialGalleryType);
    } else if (imageOnly) {
      setGalleryType('Image Gallery');
    }
  }, [initialGalleryType, imageOnly, isOpen]);

  // Fetch gallery assets from backend whenever modal opens
  useEffect(() => {
    if (!isOpen) return;

    const fetchGalleryAssets = async () => {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return;
      const user = JSON.parse(storedUser);
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

      setIsLoading(true);
      try {
        const res = await axios.get(`${backendUrl}/api/flipbook/get-gallery-assets`, {
          params: { emailId: user.emailId }
        });

        if (res.data.assets) {
          const validAssets = res.data.assets.filter(asset => {
            const urlLower = (asset.url || '').toLowerCase();
            const is3D = asset.type === '3d' || urlLower.endsWith('.glb') || urlLower.endsWith('.gltf');
            const isPDF = asset.type === 'pdf' || urlLower.endsWith('.pdf');
            return !is3D && !isPDF;
          });

          const formatted = validAssets.map((asset) => {
            const urlLower = (asset.url || '').toLowerCase();
            const fullUrl = resolveUploadsPath(asset.url);
            const isVideo = asset.type === 'video' || urlLower.endsWith('.mp4') || urlLower.endsWith('.mkv');
            const isAnimated = asset.type === 'gif' || urlLower.endsWith('.gif');
            return {
              id: asset.id || asset.name,
              name: (asset.name || 'Asset').replace(/\.[^/.]+$/, ''),
              url: fullUrl,
              rawUrl: asset.url,
              type: isVideo ? 'video' : 'image',
              isAnimated,
              uploadedAt: asset.uploadedAt || asset.created_at || new Date().toISOString()
            };
          });
          setGalleryAssets(formatted);
        }
      } catch (err) {
        console.error('Failed to fetch gallery assets:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGalleryAssets();
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target)) {
        setIsSortDropdownOpen(false);
      }
    };
    if (isDropdownOpen || isSortDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen, isSortDropdownOpen]);

  useEffect(() => {
    const handlePopupClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        if (anchorRef && anchorRef.current && anchorRef.current.contains(event.target)) {
          return;
        }
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handlePopupClickOutside);
    }
    return () => document.removeEventListener('mousedown', handlePopupClickOutside);
  }, [isOpen, onClose, anchorRef]);

  const filteredAssets = React.useMemo(() => {
    let result = galleryAssets.filter(asset => {
      if (galleryType === 'All') return true;
      if (galleryType === 'Image Gallery' && asset.type === 'image' && !asset.isAnimated) return true;
      if (galleryType === 'Video Gallery' && asset.type === 'video') return true;
      if (galleryType === 'GIF Gallery' && asset.isAnimated) return true;
      return false;
    });
    
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(asset => asset.name.toLowerCase().includes(lowerQuery));
    }
    
    result.sort((a, b) => {
      const timeA = new Date(a.uploadedAt).getTime();
      const timeB = new Date(b.uploadedAt).getTime();
      return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
    });
    
    return result;
  }, [galleryAssets, galleryType, searchQuery, sortOrder]);

  if (!isOpen) return null;

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    if (e.target.files?.length) {
      const storedUser = localStorage.getItem('user');
      const user = storedUser ? JSON.parse(storedUser) : null;
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

      const validFiles = [];
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        const lowerName = file.name.toLowerCase();
        const isAllowedType = file.type.startsWith('image/') || file.type.startsWith('video/');
        if (!isAllowedType || lowerName.endsWith('.glb') || lowerName.endsWith('.gltf') || lowerName.endsWith('.pdf')) {
          toast.error('Only Image, Video, and GIF formats are allowed.');
        } else {
          validFiles.push(file);
        }
      }

      if (validFiles.length === 0) return;

      setIsUploading(true);
      const newAssetsPromises = validFiles.map(async newFile => {
        const objectUrl = URL.createObjectURL(newFile);
        const isVideo = newFile.type.startsWith('video/');
        let isAnimated = false;
        if (newFile.type.includes('gif')) {
          isAnimated = true;
        } else if (newFile.type.includes('webp')) {
          isAnimated = await checkIsAnimatedWebp(newFile);
        }

        const tempAsset = {
          id: objectUrl,
          name: newFile.name.replace(/\.[^/.]+$/, ''),
          url: objectUrl,
          type: isVideo ? 'video' : 'image',
          isAnimated,
          file: newFile
        };

        const userEmail = user ? (user.emailId || user.email) : 'guest@fisto.tech';
        if (userEmail) {
          try {
            const formData = new FormData();
            formData.append('emailId', userEmail);
            if (imageOnly) {
              formData.append('assetType', 'gallery_image');
              formData.append('folderName', 'My_Flipbooks');
              formData.append('flipbookName', 'Untitled Document');
              formData.append('file', newFile);
              const res = await axios.post(`${backendUrl}/api/flipbook/upload-customized-asset`, formData);
              if (res.data.url) {
                return {
                  ...tempAsset,
                  id: res.data.fileName || objectUrl,
                  url: res.data.url,
                  rawUrl: res.data.url,
                  file_v_id: res.data.fileName
                };
              }
            } else {
              formData.append('isGallery', 'true');
              formData.append('type', isVideo ? 'video' : isAnimated ? 'gif' : 'image');
              formData.append('file', newFile);
              formData.append('page_v_id', 'global');

              const res = await axios.post(`${backendUrl}/api/flipbook/upload-asset`, formData);
              if (res.data.url) {
                const serverUrl = resolveUploadsPath(res.data.url);
                return {
                  ...tempAsset,
                  id: res.data.file_v_id || objectUrl,
                  url: serverUrl,
                  rawUrl: res.data.url,
                  file_v_id: res.data.file_v_id
                };
              }
            }
          } catch (err) {
            console.error('Failed to upload global asset:', err);
          }
        }
        return tempAsset;
      });

      const newAssets = await Promise.all(newAssetsPromises);
      setGalleryAssets(prev => [...newAssets, ...prev]);
      setIsUploading(false);
    }
  };

  const handleReplaceFileChange = async (e) => {
    if (e.target.files?.length && itemToReplaceId) {
      const newFile = e.target.files[0];
      const lowerName = newFile.name.toLowerCase();
      const isAllowedType = newFile.type.startsWith('image/') || newFile.type.startsWith('video/');
      if (!isAllowedType || lowerName.endsWith('.glb') || lowerName.endsWith('.gltf') || lowerName.endsWith('.pdf')) {
        toast.error('Only Image, Video, and GIF formats are allowed.');
        return;
      }
      const newUrl = URL.createObjectURL(newFile);
      const isVideo = newFile.type.startsWith('video/');
      let isAnimated = false;
      if (newFile.type.includes('gif')) {
        isAnimated = true;
      } else if (newFile.type.includes('webp')) {
        isAnimated = await checkIsAnimatedWebp(newFile);
      }

      const existingAsset = galleryAssets.find(g => g.id === itemToReplaceId);

      let updatedAsset = {
        id: newUrl,
        name: newFile.name.replace(/\.[^/.]+$/, ''),
        url: newUrl,
        type: isVideo ? 'video' : 'image',
        isAnimated,
        file: newFile
      };

      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
        const formData = new FormData();
        formData.append('emailId', user.emailId);
        formData.append('isGallery', 'true');
        formData.append('type', isVideo ? 'video' : isAnimated ? 'gif' : 'image');
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
              file_v_id: res.data.file_v_id
            };
          }
        } catch (err) {
          console.error('Failed to replace global gallery asset:', err);
        }
      }
      
      setGalleryAssets(prev => prev.map(g => g.id === itemToReplaceId ? updatedAsset : g));

      if (selectedAsset?.id === itemToReplaceId) {
        setSelectedAsset(updatedAsset);
      }
      setItemToReplaceId(null);
    }
  };

  const handleAddAssetToPage = async () => {
    if (!selectedAsset || !onFileSelect) return;

    if (selectedAsset.file) {
      onFileSelect(selectedAsset.file, selectedAsset);
      onClose();
    } else {
      try {
        const response = await fetch(selectedAsset.url);
        const blob = await response.blob();
        const mimeType = blob.type || (selectedAsset.type === 'video' ? 'video/mp4' : 'image/png');
        const ext = mimeType.split('/')[1] || 'png';
        const file = new File([blob], `${selectedAsset.name}.${ext}`, { type: mimeType });
        onFileSelect(file, selectedAsset);
        onClose();
      } catch (err) {
        console.error('Error fetching file for page insert:', err);
        onClose();
      }
    }
  };

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
          if (selectedAsset?.id === item.id) {
            setSelectedAsset(prev => ({ ...prev, name: res.data.name }));
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

  let popupStyle = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 100000,
  };

  if (anchorRef && anchorRef.current) {
    const rect = anchorRef.current.getBoundingClientRect();
    popupStyle = {
      position: 'fixed',
      top: `${rect.top + rect.height / 2}px`,
      left: `${rect.left + 60}px`,
      transform: 'translate(-100%, -50%)',
      zIndex: 100000,
    };
  }

  const galleryOptions = imageOnly ? ['Image Gallery'] : ['All', 'Image Gallery', 'Video Gallery', 'GIF Gallery'];

  return createPortal(
    <>
    {!anchorRef && (
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-[99999]"
        onClick={onClose}
      />
    )}
    <div 
      ref={popupRef}
      style={popupStyle} 
      className="bg-white rounded-[0.8vw] w-[24vw] min-w-[320px] max-w-[90vw] shadow-2xl border border-gray-300 flex flex-col font-sans relative z-[100000]" 
      onClick={(e) => {
        e.stopPropagation();
        if (!e.target.closest('.rename-input')) {
          setRenamingItemId(null);
        }
        setSelectedAsset(null);
        setActiveGalleryDropdown(null);
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-[1.5vw] pb-[1vw]">
        <h2 className="text-[0.9vw] font-bold text-gray-900 mr-[1vw]">
          {imageOnly ? 'Image Gallery' : 'Media Gallery'}
        </h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <Icon icon="lucide:x" className="w-[1vw] h-[1vw]" />
        </button>
      </div>

      {/* Content area */}
      <div className="px-[1.5vw] pb-[1.5vw] pt-0 h-[19vw] flex flex-col">
        <div className="flex flex-col flex-1 min-h-0">
          {/* Toolbar */}
          <div className="flex flex-col gap-[0.75vw] mb-[1vw] pb-[1vw] px-[1.5vw] -mx-[1.5vw] border-b border-gray-100 shrink-0">
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
              {/* Dropdown */}
              <div className="relative inline-block cursor-pointer" ref={dropdownRef}>
                <div 
                  className="flex items-center justify-between gap-[0.3vw] w-[7vw] bg-white border border-gray-200 rounded-[0.4vw] px-[0.55vw] py-[0.3vw] shadow-sm hover:bg-gray-50 transition-colors"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <span className="text-[0.7vw] font-medium text-gray-700 truncate">{galleryType}</span>
                  <Icon icon="lucide:chevron-down" className="w-[0.75vw] h-[0.75vw] text-gray-500 shrink-0" />
                </div>
                
                {isDropdownOpen && (
                  <div className="absolute top-full left-0 mt-[0.2vw] w-full bg-white border border-gray-200 rounded-[0.4vw] shadow-lg z-50 overflow-hidden">
                    {galleryOptions.map(option => (
                      <div 
                        key={option}
                        className={`px-[0.55vw] py-[0.45vw] text-[0.7vw] font-medium cursor-pointer transition-colors ${galleryType === option ? 'bg-[#F3F4F6] text-gray-900' : 'text-gray-700 hover:bg-gray-50'}`}
                        onClick={() => {
                          setGalleryType(option);
                          setIsDropdownOpen(false);
                        }}
                      >
                        {option}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Browse Files Button */}
              <div className="bg-[#4D47FF] hover:bg-[#3D38CC] rounded-[0.4vw] p-[0.15vw] shadow-sm transition-colors cursor-pointer inline-block">
                <div 
                  className="flex items-center justify-center gap-[0.45vw] cursor-pointer text-white px-[0.7vw] py-[0.2vw] rounded-[0.3vw] border-[1.5px] border-dashed border-white/60 hover:border-white transition-colors"
                  onClick={handleUploadClick}
                >
                  <Icon icon="lucide:upload" className="w-[0.75vw] h-[0.75vw] stroke-[2]" />
                  <span className="text-[0.7vw] font-medium">Browse Files</span>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/jpeg,image/png,image/webp,video/mp4,image/svg+xml,video/x-matroska,image/gif" multiple onChange={handleFileChange} onClick={(e) => { e.target.value = null; }} />
                </div>
              </div>
            </div>
          </div>

          {/* Grid */}
          <div className="flex-1 overflow-y-auto overscroll-contain min-h-0 pr-[0.5vw] will-change-scroll" onClick={() => { setSelectedAsset(null); setActiveGalleryDropdown(null); }}>
            {isLoading || isUploading ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-[0.5vw]">
                <Icon icon="lucide:loader-2" className="w-[2vw] h-[2vw] animate-spin text-[#4D47FF]" />
                <span className="text-[0.8vw] font-medium">{isUploading ? 'Uploading media...' : 'Loading media...'}</span>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-[1vw]">
                {filteredAssets.length > 0 ? filteredAssets.map((item, idx) => (
                  <div key={item.id || idx} className="flex flex-col gap-[0.4vw] relative">
                    <div 
                      draggable="true"
                      onDragStart={(e) => {
                        const dragData = {
                          type: item.type === 'video' ? 'video' : (item.isAnimated ? 'gif' : 'image'),
                          url: item.url,
                          name: item.name
                        };
                        e.dataTransfer.setData('application/json', JSON.stringify(dragData));
                        e.dataTransfer.effectAllowed = 'copy';
                        
                        // Hide dots menu for drag ghost
                        const dots = e.currentTarget.querySelector('.dots-menu-btn');
                        if (dots) {
                           dots.style.opacity = '0';
                           setTimeout(() => {
                               dots.style.opacity = '1';
                           }, 0);
                        }
                      }}
                      onDragEnd={() => onClose()}
                      className={`group cursor-pointer w-full aspect-square rounded-[0.4vw] overflow-hidden bg-gray-100 relative shadow-sm ${selectedAsset?.id === item.id ? 'border-[0.15vw] border-[#4D47FF]' : 'border border-gray-200 group-hover:shadow-md'}`}
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        if (renamingItemId === item.id) return;
                        selectedAsset?.id === item.id ? setSelectedAsset(null) : setSelectedAsset(item); 
                        setActiveGalleryDropdown(null); 
                      }}
                    >
                      {item.type === 'video' ? (
                        <video src={item.url} preload="metadata" muted playsInline className="w-full h-full object-cover pointer-events-none" />
                      ) : (
                        <img src={item.url} alt={item.name} loading="lazy" decoding="async" className="w-full h-full object-cover pointer-events-none" />
                      )}
                      <div className={`absolute inset-0 bg-black/0 ${selectedAsset?.id === item.id ? '' : 'group-hover:bg-black/5'}`} />

                      {/* Hover Three Dots */}
                      <div 
                        className={`absolute top-[0.3vw] right-[0.3vw] bg-white/90 rounded-[0.2vw] p-[0.2vw] shadow-sm hover:bg-white z-10 dots-menu-btn ${activeGalleryDropdown === item.id ? 'block' : 'hidden group-hover:block'}`}
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
                          Replace {item.type === 'video' ? 'Video' : item.isAnimated ? 'Gif' : 'Image'}
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
                                console.error('Failed to delete global asset:', err);
                                toast.error("Failed to delete asset");
                              }
                            }
                            setGalleryAssets(prev => prev.filter(g => g.id !== item.id));
                            if (selectedAsset?.id === item.id) {
                              setSelectedAsset(null);
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
                    No media found. Click "Browse Files" to add.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-[0.75vw] p-[1.5vw] border-t border-gray-100">
        <button 
          onClick={onClose}
          className="flex-1 py-[0.5vw] rounded-[0.3vw] border border-gray-200 text-gray-700 text-[0.8vw] font-medium hover:bg-gray-50 flex items-center justify-center gap-[0.5vw]"
        >
          <Icon icon="lucide:x" className="w-[0.8vw] h-[0.8vw]" /> Cancel
        </button>
        <button 
          className={`flex-1 py-[0.5vw] rounded-[0.3vw] text-white text-[0.8vw] font-medium transition-colors ${selectedAsset ? 'bg-black hover:bg-gray-800' : 'bg-[#B1B1B1] cursor-not-allowed'}`}
          onClick={handleAddAssetToPage}
          disabled={!selectedAsset}
        >
          Add To Page
        </button>
      </div>
    </div>
    {/* Hidden input for replace action */}
    <input 
      type="file" 
      ref={fileInputRefReplaceItem} 
      className="hidden" 
      accept="image/jpeg,image/png,image/webp,video/mp4,image/svg+xml,video/x-matroska,image/gif" 
      onChange={handleReplaceFileChange} 
      onClick={(e) => { e.target.value = null; }} 
    />
    </>,
    document.body
  );
};

export default MediaGalleryPopup;
