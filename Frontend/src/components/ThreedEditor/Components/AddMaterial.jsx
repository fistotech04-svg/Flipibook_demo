import React, { useState, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";
import { X, Upload, Check, AlertCircle, Edit3, ChevronDown } from "lucide-react";
import axios from "axios";
import { useToast } from "../../../components/CustomToast";
import { resolveUploadsPath } from "../../../utils/supabaseUtils";

const MapUploadBox = ({ label, id, maps, setMaps, setMapFiles, mapMenuOpen, setMapMenuOpen, handleMapUpload, loadingMaps, setLoadingMaps, isRequired = false, isSmall = false }) => {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const hasTexture = !!maps[id];

  const onDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleMapUpload(id, file);
      setMapMenuOpen(null);
    }
  };

  return (
    <div className={`flex flex-col items-center relative ${isSmall ? 'w-[10vw]' : 'w-[12vw]'}`}>
      <input 
        type="file" 
        id={`file-input-${id}`}
        ref={fileInputRef}
        className="hidden" 
        accept="image/*"
        onChange={(e) => {
          if (e.target.files[0]) {
            handleMapUpload(id, e.target.files[0]);
            setMapMenuOpen(null);
            e.target.value = null;
          }
        }}
      />
      <div 
        onClick={() => {
          if (!hasTexture) fileInputRef.current?.click();
        }}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`w-full ${isSmall ? 'h-[8.5vw]' : 'h-[10vw]'} border-[0.12vw] border-dashed ${hasTexture ? 'border-transparent' : 'border-gray-300'} rounded-[0.8vw] bg-gray-50 flex flex-col items-center justify-between py-[0.8vw] px-[0.5vw] hover:bg-gray-100 ${hasTexture ? 'hover:border-transparent cursor-default' : 'hover:border-[#5d5efc] cursor-pointer'} transition-all group relative ${hasTexture ? '' : 'overflow-hidden'} shadow-sm ${isDragging ? 'border-[#5d5efc] bg-indigo-50/50 ring-2 ring-[#5d5efc]/20' : ''}`}
      >
        {hasTexture ? (
           <>
             {/* Texture Preview */}
             <img 
               src={maps[id]} 
               alt={label} 
               className="absolute inset-0 w-full h-full object-cover rounded-[0.7vw]" 
               onLoad={() => setLoadingMaps?.(prev => ({ ...prev, [id]: false }))}
             />
             
             {/* Loading Overlay */}
             {loadingMaps?.[id] && (
               <div className="absolute inset-0 bg-gray-50 flex flex-col items-center justify-center z-30 rounded-[0.7vw] border-[0.12vw] border-gray-100">
                  <div className="w-[1.2vw] h-[1.2vw] border-[0.15vw] border-gray-200 border-t-[#5d5efc] rounded-full animate-spin shadow-sm" />
               </div>
             )}
             
             {/* Black Gradient Shadow at bottom */}
             <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10 rounded-[0.7vw]" />
             
             {/* White Label at bottom */}
             <div className="absolute bottom-[0.8vw] left-0 right-0 px-[0.5vw] flex items-center justify-center z-20">
                <span className="text-[0.7vw] font-bold text-white tracking-tight drop-shadow-sm uppercase">{label}</span>
             </div>

             {/* Three Dots Toggle - Only on Hover */}
             <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setMapMenuOpen(mapMenuOpen === id ? null : id);
                }}
                className={`absolute top-[0.5vw] right-[0.5vw] w-[1.5vw] h-[1.5vw] cursor-pointer bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-700 hover:bg-white transition-all z-30 shadow-md menu-toggle-btn ${mapMenuOpen === id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
             >
                <Icon icon="heroicons:ellipsis-vertical-20-solid" width="1vw" />
             </button>

             {/* Map Context Menu */}
             {mapMenuOpen === id && (
               <div className="absolute top-[2.2vw] right-[0.5vw] bg-white rounded-[0.6vw] shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-400 py-[0.3vw] px-[0.15vw] min-w-[7.5vw] z-[40] map-menu-container animate-in fade-in zoom-in duration-150">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                      setMapMenuOpen(null);
                    }}
                    className="w-full flex items-center gap-[0.5vw] cursor-pointer px-[0.6vw] py-[0.35vw] hover:bg-gray-50 rounded-[0.4vw] text-gray-700 transition-colors group/item"
                  >
                    <Icon icon="ix:replace" className="w-[1vw] h-[1vw] text-[#5d5efc]" />
                    <span className="text-[0.6vw] font-semibold text-gray-600">Replace Map</span>
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setMaps(prev => ({ ...prev, [id]: null }));
                      setMapFiles(prev => ({ ...prev, [id]: null }));
                      setMapMenuOpen(null);
                    }}
                    className="w-full flex items-center gap-[0.5vw] cursor-pointer px-[0.6vw] py-[0.35vw] hover:bg-red-50 rounded-[0.4vw] text-red-500 transition-colors border-t border-gray-50 mt-[0.1vw]"
                  >
                    <Icon icon="solar:trash-bin-trash-linear" className="w-[1vw] h-[1vw]" />
                    <span className="text-[0.6vw] font-semibold">Clear Map</span>
                  </button>
               </div>
             )}
           </>
        ) : (
          <>
            {/* Label inside the box at the top */}
            <div className="text-[0.8vw] font-bold text-gray-900 flex items-center gap-[0.2vw] z-10">
              {label} {isRequired && <span className="text-red-500">*</span>}
            </div>
            
            <div className="flex flex-col items-center gap-[0.4vw] z-10">
              <Icon icon="heroicons:arrow-up-tray-20-solid" width="1.4vw" className="text-gray-400 group-hover:text-[#5d5efc] transition-colors" />
            </div>

            <div className="flex flex-col items-center z-10">
              <span className="text-[0.55vw] font-medium text-gray-500">Click to <span className="text-[#5d5efc] font-bold">Upload</span> JPG or PNG</span>
              <span className="text-[0.5vw] text-gray-400 font-medium">(2048px recommended)</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default function AddMaterial({ isOpen, onClose, editData, onUpdateSuccess }) {
  const [materialName, setMaterialName] = useState("");
  const [category, setCategory] = useState("");
  const [existingCategories, setExistingCategories] = useState([]);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mapMenuOpen, setMapMenuOpen] = useState(null);
  const [isPreviewDragging, setIsPreviewDragging] = useState(false);
  const [loadingMaps, setLoadingMaps] = useState({});
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  // Initialize state when editData is provided
  useEffect(() => {
    if (editData && isOpen) {
      setMaterialName(editData.name || "");
      setCategory(editData.category || "");
      
      const resolvedMaps = {};
      const initialLoading = {};
      Object.keys(editData.maps || {}).forEach(key => {
        if (editData.maps[key]) {
          resolvedMaps[key] = resolveUploadsPath(editData.maps[key]);
          initialLoading[key] = true;
        }
      });
      
      setLoadingMaps(initialLoading);
      
      setMaps({
        preview: null, base: null, metallic: null, roughness: null, normal: null,
        ao: null, displacement: null, opacity: null, emissive: null,
        ...resolvedMaps
      });
      
      // Reset map files as we start with existing URLs
      setMapFiles({
        preview: null, base: null, metallic: null, roughness: null, normal: null,
        ao: null, displacement: null, opacity: null, emissive: null
      });
    } else if (!editData && isOpen) {
       // Reset for New Material mode
       setMaterialName("");
       setCategory("");
       setMaps({
         preview: null, base: null, metallic: null, roughness: null, normal: null,
         ao: null, displacement: null, opacity: null, emissive: null
       });
       setMapFiles({
         preview: null, base: null, metallic: null, roughness: null, normal: null,
         ao: null, displacement: null, opacity: null, emissive: null
       });
    }
  }, [editData, isOpen]);

  // Fetch unique categories
  useEffect(() => {
    if (isOpen) {
      const fetchCategories = async () => {
        const userStr = localStorage.getItem("user");
        const user = userStr ? JSON.parse(userStr) : null;
        if (!user?.emailId) return;

        try {
          const response = await axios.get(`${backendUrl}/api/textures/categories/get?email=${user.emailId}`);
          if (response.data.categories) {
            const catNames = response.data.categories.map(c => c.name);
            const uniqueCats = [...new Set(catNames)];
            setExistingCategories(uniqueCats.filter(c => c !== "All" && typeof c === 'string'));
          }
        } catch (error) {
          console.error("Error fetching categories:", error);
        }
      };
      fetchCategories();
    }
  }, [isOpen]);

  // States for all maps
  const [maps, setMaps] = useState({
    preview: null,
    base: null,
    metallic: null,
    roughness: null,
    normal: null,
    ao: null,
    displacement: null,
    opacity: null,
    emissive: null
  });

  const [mapFiles, setMapFiles] = useState({
    preview: null,
    base: null,
    metallic: null,
    roughness: null,
    normal: null,
    ao: null,
    displacement: null,
    opacity: null,
    emissive: null
  });

  const handleMapUpload = (id, file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setMaps(prev => ({ ...prev, [id]: url }));
    setMapFiles(prev => ({ ...prev, [id]: file }));
  };

  const uploadFileInChunks = async (file, id, email, material, field) => {
    const CHUNK_SIZE = 5 * 1024 * 1024; // Increased to 5MB for better performance
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const uploadId = `${id}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    let finalUrl = null;

    for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        const formData = new FormData();
        formData.append("chunkIndex", i);
        formData.append("totalChunks", totalChunks);
        formData.append("uploadId", uploadId);
        formData.append("fileName", file.name);
        formData.append("userEmail", email);
        formData.append("materialName", material);
        formData.append("fieldName", field);
        formData.append("chunk", chunk);

        const response = await axios.post(`${backendUrl}/api/textures/upload-chunk`, formData);
        
        if (i === totalChunks - 1) {
            if (!response.data.url) {
                throw new Error(`Server did not return a URL for field ${field}`);
            }
            finalUrl = response.data.url;
        }
    }
    return finalUrl;
  };

  const handleAddMaterial = async () => {
    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;
    const email = user?.emailId;
    
    if (!email) {
        toast.error("User session not found. Please login again.");
        return;
    }

    if (!materialName.trim()) {
        toast.error("Please enter a material name.");
        return;
    }

    if (!category.trim()) {
        toast.error("Please enter a material category.");
        return;
    }

    // Required Surface Maps check (Allow existing maps in Edit mode)
    const requiredMaps = ["base", "metallic", "roughness", "normal"];
    const missingMaps = requiredMaps.filter(m => !mapFiles[m] && !maps[m]);
    
    if (missingMaps.length > 0) {
        toast.error(`Please upload all required surface maps: ${missingMaps.join(", ").toUpperCase()}`);
        return;
    }
    
    // Check if Edit mode has changes or new maps
    if (editData && !materialName.trim() && !category.trim() && Object.keys(mapFiles).every(k => !mapFiles[k])) {
        onClose();
        return;
    }

    setIsSubmitting(true);
    
    try {
        const newlyUploadedMaps = {};
        const mapKeysToUpload = Object.keys(mapFiles).filter(key => mapFiles[key]);
        
        // Parallelized upload for all provided files to maximize bandwidth usage
        const uploadPromises = mapKeysToUpload.map(async (key) => {
            try {
                const url = await uploadFileInChunks(mapFiles[key], key, email, materialName, key);
                return { key, url };
            } catch (err) {
                console.error(`Failed to upload ${key}:`, err);
                throw err; // Re-throw to be caught by the outer catch
            }
        });

        const results = await Promise.all(uploadPromises);
        results.forEach(res => {
            newlyUploadedMaps[res.key] = res.url;
        });

        const finalMaps = editData 
            ? { ...editData.maps, ...newlyUploadedMaps }
            : newlyUploadedMaps;

        if (editData) {
            // UPDATE existing material
            const response = await axios.put(`${backendUrl}/api/textures/update/${editData.id}`, {
                materialName,
                materialCategory: category,
                maps: newlyUploadedMaps // Only send the new maps to the update endpoint (which merges them)
            });

            if (response.status === 200) {
                toast.success("Material updated successfully!");
                if (onUpdateSuccess) onUpdateSuccess();
                onClose();
            }
        } else {
            // ADD new material
            const response = await axios.post(`${backendUrl}/api/textures/add`, {
                userEmail: email,
                materialName,
                materialCategory: category,
                maps: finalMaps
            });

            if (response.status === 201) {
                toast.success("Material created successfully!");
                if (onUpdateSuccess) onUpdateSuccess();
                onClose();
            }
        }
    } catch (error) {
        console.error("Upload Error:", error);
        toast.error(error.response?.data?.message || "Operation failed. Please try again.");
    } finally {
        setIsSubmitting(false);
    }
  };

  const scrollRef = useRef(null);
  const [showTopShadow, setShowTopShadow] = useState(false);
  const [showBottomShadow, setShowBottomShadow] = useState(false);

  const handleScroll = () => {
      if (!scrollRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      setShowTopShadow(scrollTop > 10);
      setShowBottomShadow(scrollHeight > scrollTop + clientHeight + 10);
  };

  useEffect(() => {
      const handleClickOutside = (e) => {
          if (mapMenuOpen && !e.target.closest('.map-menu-container') && !e.target.closest('.menu-toggle-btn')) {
              setMapMenuOpen(null);
          }
          if (isCategoryDropdownOpen && !e.target.closest('.category-dropdown-container')) {
              setIsCategoryDropdownOpen(false);
          }
      };
      window.addEventListener('mousedown', handleClickOutside);
      return () => {
          window.removeEventListener('mousedown', handleClickOutside);
          window.removeEventListener('resize', handleScroll);
      };
  }, [isOpen, mapMenuOpen, isCategoryDropdownOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed top-[8vh] left-0 right-0 bottom-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
      <div className="bg-white w-[50vw] max-h-[85vh] rounded-[1.2vw] shadow-[0_20px_50px_rgba(0,0,0,0.2)] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
        
        {/* Header - Fixed */}
        <div className="px-[2vw] pt-[1.5vw] pb-[1vw] flex items-start justify-between border-b border-gray-50">
          <div className="flex flex-col gap-[0.3vw] flex-1">
            <div className="flex items-center gap-[1vw]">
                <h2 className="text-[1.4vw] font-bold text-gray-900 tracking-tight whitespace-nowrap">{editData ? "Edit Material" : "Add New Material"}</h2>
                <div className="h-[0.1vw] bg-gray-100 flex-1 ml-[0.5vw]"></div>
            </div>
            <p className="text-[0.8vw] text-gray-500 font-medium">{editData ? "Update the texture maps or details of this material." : "Upload texture maps to create a new material."}</p>
          </div>
          <button 
            onClick={onClose}
            className="w-[2vw] h-[2vw] rounded-full border border-red-200 text-red-400 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all ml-[2vw]"
          >
            <X size="1.2vw" />
          </button>
        </div>

        {/* Scrollable Content Container with relative wrapper for shadows */}
        <div className="flex-1 relative flex flex-col overflow-hidden">
            {/* Top Shadow - Subtle Visibility */}
            <div className={`absolute top-0 left-0 right-0 h-[2.5vw] bg-gradient-to-b from-black/5 via-black/5 to-transparent z-20 pointer-events-none transition-opacity duration-300 ${showTopShadow ? 'opacity-100' : 'opacity-0'}`} />

            {/* Scrollable Content Area */}
            <div 
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto custom-scrollbar px-[2vw] py-[1.2vw] flex flex-col gap-[1.2vw]"
            >
          
          {/* Top Section: Preview & Settings - Reduced Size */}
          <div className="flex gap-[1.5vw] bg-gray-200 p-[1.2vw] rounded-[0.8vw] border border-gray-100">
            {/* Main Preview Upload */}
            <div className="flex flex-col gap-[0.4vw]">
                <span className="text-[0.75vw] font-bold text-gray-900">Material Preview</span>
                <input 
                  type="file" 
                  id="preview-upload"
                  className="hidden" 
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files[0]) {
                        handleMapUpload('preview', e.target.files[0]);
                        e.target.value = null;
                    }
                  }}
                />
                <div 
                    onClick={() => {
                        if (!maps.preview) document.getElementById('preview-upload').click();
                    }}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsPreviewDragging(true); }}
                    onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsPreviewDragging(false); }}
                    onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsPreviewDragging(false);
                        const file = e.dataTransfer.files[0];
                        if (file && file.type.startsWith('image/')) {
                            handleMapUpload('preview', file);
                        }
                    }}
                    className={`w-[10vw] h-[8.5vw] border-[0.12vw] border-dashed ${maps.preview ? 'border-transparent' : 'border-gray-400'} rounded-[0.8vw] bg-white flex flex-col items-center justify-center gap-[0.8vw] ${maps.preview ? 'hover:border-transparent cursor-default' : 'hover:border-[#5d5efc] cursor-pointer'} transition-all group shadow-sm relative overflow-hidden ${isPreviewDragging ? 'border-[#5d5efc] bg-indigo-50/50 ring-2 ring-[#5d5efc]/20' : ''}`}
                >
                    {maps.preview ? (
                        <>
                            <img 
                                src={maps.preview} 
                                alt="Preview" 
                                className="absolute inset-0 w-full h-full object-cover rounded-[0.7vw]" 
                                onLoad={() => setLoadingMaps(prev => ({ ...prev, preview: false }))}
                            />

                            {/* Loading Overlay */}
                            {loadingMaps.preview && (
                                <div className="absolute inset-0 bg-gray-50 flex flex-col items-center justify-center z-30 rounded-[0.7vw] border-[0.12vw] border-gray-100">
                                    <div className="w-[1.5vw] h-[1.5vw] border-[0.15vw] border-gray-200 border-t-[#5d5efc] rounded-full animate-spin shadow-sm" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
                            <div className="absolute bottom-[0.8vw] left-0 right-0 px-[0.5vw] flex items-center justify-center z-20">
                                <span className="text-[0.7vw] font-bold text-white tracking-tight drop-shadow-sm uppercase">Main Preview</span>
                            </div>

                            {/* Three Dots Toggle - Only on Hover */}
                            <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMapMenuOpen(mapMenuOpen === 'preview' ? null : 'preview');
                                }}
                                className={`absolute top-[0.5vw] right-[0.5vw] w-[1.5vw] h-[1.5vw] cursor-pointer bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-700 hover:bg-white transition-all z-30 shadow-md menu-toggle-btn ${mapMenuOpen === 'preview' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                            >
                                <Icon icon="heroicons:ellipsis-vertical-20-solid" width="1vw" />
                            </button>

                            {/* Map Context Menu (Rendered INSIDE the box) */}
                            {mapMenuOpen === 'preview' && (
                                <div className="absolute top-[2.2vw] right-[0.5vw] bg-white rounded-[0.6vw] shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-400 py-[0.3vw] px-[0.15vw] min-w-[7.5vw] z-[40] map-menu-container animate-in fade-in zoom-in duration-150">
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      document.getElementById('preview-upload').click();
                                      setMapMenuOpen(null);
                                    }}
                                    className="w-full flex items-center gap-[0.5vw] cursor-pointer px-[0.6vw] py-[0.35vw] hover:bg-gray-50 rounded-[0.4vw] text-gray-700 transition-colors group/item"
                                  >
                                    <Icon icon="ix:replace" className="w-[1vw] h-[1vw] text-[#5d5efc]" />
                                    <span className="text-[0.6vw] font-semibold text-gray-600">Replace Map</span>
                                  </button>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setMaps(prev => ({ ...prev, preview: null }));
                                      setMapFiles(prev => ({ ...prev, preview: null }));
                                      setMapMenuOpen(null);
                                    }}
                                    className="w-full flex items-center gap-[0.5vw] cursor-pointer px-[0.6vw] py-[0.35vw] hover:bg-red-50 rounded-[0.4vw] text-red-500 transition-colors border-t border-gray-50 mt-[0.1vw]"
                                  >
                                    <Icon icon="solar:trash-bin-trash-linear" className="w-[1vw] h-[1vw]" />
                                    <span className="text-[0.6vw] font-semibold">Clear Map</span>
                                  </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            <div className="flex flex-col items-center">
                                <span className="text-[0.55vw] font-medium text-gray-500">Drag & Drop or <span className="text-[#5d5efc] font-bold">Upload</span></span>
                            </div>
                            <Icon icon="heroicons:arrow-up-tray-20-solid" width="1.6vw" className="text-gray-400 group-hover:text-[#5d5efc] transition-all" />
                            <span className="text-[0.45vw] text-gray-400 font-bold uppercase tracking-wider">Supported File: JPG, PNG</span>
                        </>
                    )}
                </div>
            </div>

            {/* Basic Info */}
            <div className="flex-1 flex flex-col gap-[0.8vw] justify-center">
                <div className="flex flex-col gap-[0.4vw]">
                    <span className="text-[0.8vw] font-bold text-gray-900">Material Name</span>
                    <div className="relative group">
                        <input 
                            type="text" 
                            placeholder="Enter Texture Name"
                            value={materialName}
                            onChange={(e) => setMaterialName(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-[0.5vw] px-[0.8vw] py-[0.6vw] text-[0.75vw] font-semibold text-gray-800 outline-none focus:border-gray-400 transition-all shadow-sm group-hover:border-gray-300"
                        />
                        <Edit3 size="0.9vw" className="absolute right-[0.8vw] top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-gray-600 transition-all" />
                    </div>
                </div>

                <div className="flex flex-col gap-[0.4vw]">
                    <span className="text-[0.8vw] font-bold text-gray-900">Material Category</span>
                    <div className="relative group category-dropdown-container">
                        <input 
                            type="text" 
                            placeholder="Enter Category (e.g., Bike Texture)"
                            value={category}
                            onFocus={() => setIsCategoryDropdownOpen(true)}
                            onChange={(e) => {
                                setCategory(e.target.value);
                                setIsCategoryDropdownOpen(true);
                            }}
                            className="w-full bg-white border border-gray-200 rounded-[0.5vw] px-[0.8vw] py-[0.6vw] pr-[2.5vw] text-[0.75vw] font-semibold text-gray-800 outline-none focus:border-gray-400 transition-all shadow-sm group-hover:border-gray-300"
                        />
                        <button 
                            onClick={(e) => {
                                e.preventDefault();
                                setIsCategoryDropdownOpen(!isCategoryDropdownOpen);
                            }}
                            className="absolute right-[0.8vw] top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-all cursor-pointer flex items-center justify-center h-full"
                        >
                            <ChevronDown size="1vw" className={`transition-transform duration-200 ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Dropdown List */}
                        {isCategoryDropdownOpen && existingCategories.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-[0.4vw] bg-white border border-gray-100 rounded-[0.7vw] shadow-[0_10px_30px_rgba(0,0,0,0.1)] z-50 max-h-[12vw] overflow-y-auto custom-scrollbar flex flex-col py-[0.4vw] animate-in fade-in slide-in-from-top-2 duration-200">
                                {existingCategories
                                    .filter(c => typeof c === 'string' && c.toLowerCase().includes(category.toLowerCase()))
                                    .map((cat, idx) => (
                                        <button 
                                            key={idx}
                                            onClick={() => {
                                                setCategory(cat);
                                                setIsCategoryDropdownOpen(false);
                                            }}
                                            className="w-full text-left px-[1vw] py-[0.6vw] hover:bg-gray-50 text-[0.75vw] font-medium text-gray-600 transition-colors"
                                        >
                                            {cat}
                                        </button>
                                    ))
                                }
                                {existingCategories.filter(c => typeof c === 'string' && c.toLowerCase().includes(category.toLowerCase())).length === 0 && (
                                    <div className="px-[1vw] py-[0.6vw] text-[0.7vw] text-gray-400 italic">
                                        Type to create new: "{category}"
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
          </div>

          {/* Notes Alert */}
          <div className="bg-red-50/50 border border-red-100/50 py-[0.6vw] px-[1vw] rounded-[0.5vw] flex items-center gap-[0.6vw]">
            <AlertCircle size="1vw" className="text-red-500" />
            <p className="text-[0.7vw] font-medium text-gray-600">
                <span className="font-bold text-red-500 uppercase tracking-tight mr-[0.4vw]">Notes:</span>
                Upload the correct texture maps in their respective slots to achieve accurate material appearance.
            </p>
          </div>

          {/* Surface Maps Section */}
          <div className="flex flex-col gap-[1vw]">
            <div className="flex items-center gap-[0.5vw]">
                <h3 className="text-[1vw] font-bold text-gray-900 tracking-tight">Surface Maps</h3>
                <span className="text-red-500 text-[1vw]">*</span>
                <div className="h-[0.1vw] flex-1 bg-gray-50 ml-[0.5vw]"></div>
            </div>
            <div className="grid grid-cols-4 gap-[1.5vw]">
                <MapUploadBox label="Base Map" id="base" isSmall maps={maps} setMaps={setMaps} setMapFiles={setMapFiles} mapMenuOpen={mapMenuOpen} setMapMenuOpen={setMapMenuOpen} handleMapUpload={handleMapUpload} loadingMaps={loadingMaps} setLoadingMaps={setLoadingMaps} />
                <MapUploadBox label="Metallic Map" id="metallic" isSmall maps={maps} setMaps={setMaps} setMapFiles={setMapFiles} mapMenuOpen={mapMenuOpen} setMapMenuOpen={setMapMenuOpen} handleMapUpload={handleMapUpload} loadingMaps={loadingMaps} setLoadingMaps={setLoadingMaps} />
                <MapUploadBox label="Roughness Map" id="roughness" isSmall maps={maps} setMaps={setMaps} setMapFiles={setMapFiles} mapMenuOpen={mapMenuOpen} setMapMenuOpen={setMapMenuOpen} handleMapUpload={handleMapUpload} loadingMaps={loadingMaps} setLoadingMaps={setLoadingMaps} />
                <MapUploadBox label="Normal Map" id="normal" isSmall maps={maps} setMaps={setMaps} setMapFiles={setMapFiles} mapMenuOpen={mapMenuOpen} setMapMenuOpen={setMapMenuOpen} handleMapUpload={handleMapUpload} loadingMaps={loadingMaps} setLoadingMaps={setLoadingMaps} />
            </div>
          </div>

          {/* Advanced Maps Section */}
          <div className="flex flex-col gap-[1vw]">
             <div className="flex items-center gap-[0.5vw]">
                <h3 className="text-[1vw] font-bold text-gray-900 tracking-tight">Advanced Maps <span className="text-gray-400 font-medium">(Optional)</span></h3>
                <div className="h-[0.1vw] flex-1 bg-gray-50 ml-[0.5vw]"></div>
             </div>
             <div className="grid grid-cols-4 gap-[1.5vw]">
                <MapUploadBox label="A/O Map" id="ao" isSmall maps={maps} setMaps={setMaps} setMapFiles={setMapFiles} mapMenuOpen={mapMenuOpen} setMapMenuOpen={setMapMenuOpen} handleMapUpload={handleMapUpload} loadingMaps={loadingMaps} setLoadingMaps={setLoadingMaps} />
                <MapUploadBox label="Displacement" id="displacement" isSmall maps={maps} setMaps={setMaps} setMapFiles={setMapFiles} mapMenuOpen={mapMenuOpen} setMapMenuOpen={setMapMenuOpen} handleMapUpload={handleMapUpload} loadingMaps={loadingMaps} setLoadingMaps={setLoadingMaps} />
                <MapUploadBox label="Opacity Map" id="opacity" isSmall maps={maps} setMaps={setMaps} setMapFiles={setMapFiles} mapMenuOpen={mapMenuOpen} setMapMenuOpen={setMapMenuOpen} handleMapUpload={handleMapUpload} loadingMaps={loadingMaps} setLoadingMaps={setLoadingMaps} />
                <MapUploadBox label="Emissive Map" id="emissive" isSmall maps={maps} setMaps={setMaps} setMapFiles={setMapFiles} mapMenuOpen={mapMenuOpen} setMapMenuOpen={setMapMenuOpen} handleMapUpload={handleMapUpload} loadingMaps={loadingMaps} setLoadingMaps={setLoadingMaps} />
            </div>
          </div>

          {/* Bottom Shadow - Corrected Position & Subtle Visibility */}
          <div className={`absolute bottom-0 left-0 right-0 h-[2.5vw] bg-gradient-to-t from-black/10 via-black/5 to-transparent z-20 pointer-events-none transition-opacity duration-300 ${showBottomShadow ? 'opacity-100' : 'opacity-0'}`} />
        </div>
        </div>

        {/* Footer Area - Fixed */}
        <div className="px-[2vw] py-[1.2vw] flex items-center justify-center gap-[1.5vw] border-t border-gray-100 bg-white">
            <button 
                onClick={onClose}
                className="flex-1 flex items-center cursor-pointer justify-center gap-[0.5vw] py-[0.8vw] border-[0.1vw] border-gray-800 rounded-[0.5vw] text-[0.85vw] font-bold text-gray-800 hover:bg-gray-50 transition-all shadow-sm"
            >
                <X size="1vw" />
                Cancel
            </button>
            <button 
                onClick={handleAddMaterial}
                disabled={isSubmitting}
                className={`flex-1 flex items-center cursor-pointer justify-center gap-[0.8vw] py-[0.8vw] bg-black text-white rounded-[0.5vw] text-[0.85vw] font-bold hover:bg-zinc-800 transition-all shadow-lg ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                {isSubmitting ? (
                    <Icon icon="line-md:loading-twotone-loop" width="1.2vw" />
                ) : (
                    <Check size="1.2vw" />
                )}
                {isSubmitting ? (editData ? "Updating..." : "Creating...") : (editData ? "Update Material" : "Add Material")}
            </button>
        </div>
      </div>
    </div>
  );
}

