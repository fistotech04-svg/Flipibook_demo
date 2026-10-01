import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react";
import axios from "axios";
import { textureData } from "../../data/textureData";
import AddMaterial from "./Components/AddMaterial";
import AlertModal from "../AlertModal";
import { resolveUploadsPath } from "../../utils/supabaseUtils";

export default function TextureGalleryBar({ isOpen, setIsOpen, onSelectTexture, selectedTextureId, onAddMaterialClick, refreshTrigger, onSelectColor, selectedColor }) {
    const scrollRef = React.useRef(null);
    const [localSelected, setLocalSelected] = useState(null);
    const [uploadedTextures, setUploadedTextures] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const [mainTab, setMainTab] = useState("texture"); // "texture" | "color"
    const [activeTab, setActiveTab] = useState("predefined"); // "predefined" | "uploaded"
    const [selectedColorState, setSelectedColorState] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [menuOpenId, setMenuOpenId] = useState(null);
    const [showMoveTo, setShowMoveTo] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

    const [editingTexture, setEditingTexture] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ isOpen: false, type: 'texture', data: null }); // type: 'texture' | 'category' | 'clear'

    const [fetchedCategories, setFetchedCategories] = useState([]);
    const [categoryMenuOpenId, setCategoryMenuOpenId] = useState(null);
    const [categoryMenuPosition, setCategoryMenuPosition] = useState({ x: 0, y: 0 });
    const [renamingCategoryId, setRenamingCategoryId] = useState(null);
    const [renameValue, setRenameValue] = useState("");
    const [pendingTexture, setPendingTexture] = useState(null);

    // Use data from centralized file
    const predefinedTextures = textureData;

    const colorMaterials = useMemo(() => [
        { 
            id: 'c-black',  name: 'Black Matte', hex: '#111111', color: '#111111',
            normal: 40, roughness: 85, metallic: 5, ao: 100, bump: 25, emissiveColor: '#000000', emissiveIntensity: 0,
            light: '#555555', dark: '#000000' 
        },
        { 
            id: 'c-white',  name: 'White Ceramic', hex: '#ffffff', color: '#ffffff',
            normal: 10, roughness: 15, metallic: 0, ao: 100, bump: 5, emissiveColor: '#000000', emissiveIntensity: 0,
            light: '#ffffff', dark: '#cccccc' 
        },
        { 
            id: 'c-gray',   name: 'Gray Industrial', hex: '#808080', color: '#808080',
            normal: 45, roughness: 50, metallic: 45, ao: 90, bump: 20, emissiveColor: '#000000', emissiveIntensity: 0,
            light: '#bbbbbb', dark: '#444444' 
        },
        { 
            id: 'c-beige',  name: 'Beige Satin', hex: '#d7c4b7', color: '#d7c4b7',
            normal: 30, roughness: 65, metallic: 10, ao: 95, bump: 15, emissiveColor: '#000000', emissiveIntensity: 0,
            light: '#f0e6df', dark: '#a89487' 
        },
        { 
            id: 'c-brown',  name: 'Brown Leather', hex: '#653818', color: '#653818',
            normal: 75, roughness: 70, metallic: 15, ao: 85, bump: 50, emissiveColor: '#000000', emissiveIntensity: 0,
            light: '#995d31', dark: '#3b1d08' 
        },
        { 
            id: 'c-red',    name: 'Red Car Gloss', hex: '#e53935', color: '#e53935',
            normal: 15, roughness: 12, metallic: 25, ao: 100, bump: 5, emissiveColor: '#000000', emissiveIntensity: 0,
            light: '#ff6659', dark: '#9a0007' 
        },
        { 
            id: 'c-orange', name: 'Orange Amber', hex: '#fb8c00', color: '#fb8c00',
            normal: 25, roughness: 25, metallic: 20, ao: 95, bump: 10, emissiveColor: '#000000', emissiveIntensity: 0,
            light: '#ffad42', dark: '#bb4d00' 
        },
        { 
            id: 'c-yellow', name: 'Yellow Neon Glow', hex: '#fdd835', color: '#fdd835',
            normal: 10, roughness: 20, metallic: 10, ao: 100, bump: 5, emissiveColor: '#fdd835', emissiveIntensity: 45,
            light: '#fff263', dark: '#c49000' 
        },
        { 
            id: 'c-green',  name: 'Green Emerald', hex: '#43a047', color: '#43a047',
            normal: 40, roughness: 30, metallic: 75, ao: 90, bump: 25, emissiveColor: '#000000', emissiveIntensity: 0,
            light: '#6abf69', dark: '#00600f' 
        },
        { 
            id: 'c-blue',   name: 'Blue Metallic', hex: '#1e88e5', color: '#1e88e5',
            normal: 35, roughness: 25, metallic: 80, ao: 95, bump: 15, emissiveColor: '#000000', emissiveIntensity: 0,
            light: '#63a4ff', dark: '#004ba0' 
        },
        { 
            id: 'c-navy',   name: 'Navy Anodized Steel', hex: '#0d1b2a', color: '#0d1b2a',
            normal: 50, roughness: 28, metallic: 88, ao: 100, bump: 30, emissiveColor: '#000000', emissiveIntensity: 0,
            light: '#2c3e50', dark: '#04080e' 
        },
        { 
            id: 'c-purple', name: 'Purple Velvet', hex: '#8e24aa', color: '#8e24aa',
            normal: 70, roughness: 80, metallic: 10, ao: 85, bump: 55, emissiveColor: '#000000', emissiveIntensity: 0,
            light: '#ae52d4', dark: '#4a0072' 
        },
        { 
            id: 'c-pink',   name: 'Pink Pearl', hex: '#e91e63', color: '#e91e63',
            normal: 20, roughness: 18, metallic: 40, ao: 100, bump: 8, emissiveColor: '#000000', emissiveIntensity: 0,
            light: '#ff6090', dark: '#b0003a' 
        },
        { 
            id: 'c-cyan',   name: 'Cyan Glossy', hex: '#00acc1', color: '#00acc1',
            normal: 15, roughness: 14, metallic: 15, ao: 100, bump: 5, emissiveColor: '#000000', emissiveIntensity: 0,
            light: '#5ddef4', dark: '#007c91' 
        },
        { 
            id: 'c-teal',   name: 'Teal Brushed Metal', hex: '#00897b', color: '#00897b',
            normal: 60, roughness: 42, metallic: 82, ao: 90, bump: 35, emissiveColor: '#000000', emissiveIntensity: 0,
            light: '#4ebaaa', dark: '#005b4f' 
        },
        { 
            id: 'c-gold',   name: 'Gold Polished', hex: '#d4af37', color: '#d4af37',
            normal: 10, roughness: 8, metallic: 96, ao: 100, bump: 5, emissiveColor: '#000000', emissiveIntensity: 0,
            light: '#ffe082', dark: '#997a15' 
        },
        { 
            id: 'c-silver', name: 'Silver Chrome', hex: '#c0c0c0', color: '#c0c0c0',
            normal: 5, roughness: 5, metallic: 98, ao: 100, bump: 2, emissiveColor: '#000000', emissiveIntensity: 0,
            light: '#ffffff', dark: '#8a8a8a' 
        },
        { 
            id: 'c-bronze', name: 'Bronze Vintage', hex: '#cd7f32', color: '#cd7f32',
            normal: 65, roughness: 38, metallic: 88, ao: 90, bump: 40, emissiveColor: '#000000', emissiveIntensity: 0,
            light: '#ffa500', dark: '#8b4513' 
        }
    ], []);

    const selectedColorName = useMemo(() => {
        const activeColor = selectedColorState || selectedColor;
        if (!activeColor) return "None";
        const found = colorMaterials.find(c => c.hex.toLowerCase() === activeColor.toLowerCase());
        return found ? found.name : activeColor;
    }, [selectedColorState, selectedColor, colorMaterials]);

    const fetchUploadedTextures = useCallback(async () => {
        const userStr = localStorage.getItem("user");
        const user = userStr ? JSON.parse(userStr) : null;
        if (!user?.emailId) return;

        setIsLoading(true);
        try {
            const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/textures/get?email=${user.emailId}`);
            if (response.data.textures) {
                // Map backend format to UI format
                const mapped = response.data.textures.map(t => ({
                    id: t._id,
                    name: t.materialName,
                    category: typeof t.materialCategory === 'object' ? t.materialCategory?.name : (t.materialCategory || "Custom"),
                    // Use preview if available, otherwise base map
                    thumb: t.maps.preview || t.maps.base,
                    // Store all maps for selection
                    maps: t.maps,
                    isUploaded: true
                }));
                setUploadedTextures(mapped);
            }
        } catch (error) {
            console.error("Error fetching uploaded textures:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchCategories = useCallback(async () => {
        const userStr = localStorage.getItem("user");
        const user = userStr ? JSON.parse(userStr) : null;
        if (!user?.emailId) return;

        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
            const response = await axios.get(`${backendUrl}/api/textures/categories/get?email=${user.emailId}`);
            if (response.data.categories) {
                setFetchedCategories(response.data.categories);
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    }, []);

    useEffect(() => {
        if (activeTab === "uploaded" || refreshTrigger) {
            fetchUploadedTextures();
            fetchCategories();
        }
    }, [activeTab, fetchUploadedTextures, fetchCategories, refreshTrigger]);

    // Re-fetch when AddMaterial modal closes (if we had a way to trigger it, but for now we poll or manual refresh)
    // Actually, we can just fetch whenever activeTab becomes uploaded.

    const currentTextures = activeTab === "predefined" ? predefinedTextures : uploadedTextures;

    const categories = useMemo(() => {
        const counts = {};
        // Use active textures to count
        currentTextures.forEach(t => {
            const cat = t.category || "General";
            counts[cat] = (counts[cat] || 0) + 1;
        });

        // Collect unique category names
        // Only include fetched categories from backend if we are in the 'uploaded' tab
        const allCategoryNames = new Set();
        if (activeTab === "uploaded") {
            fetchedCategories.forEach(c => allCategoryNames.add(c.name));
        }
        
        Object.keys(counts).forEach(name => allCategoryNames.add(name));
        
        const realTextureCount = currentTextures.filter(t => t.id !== "none").length;
        const finalObj = { All: realTextureCount };
        Array.from(allCategoryNames).sort().forEach(name => {
            if (name !== "All") {
                finalObj[name] = counts[name] || 0;
            }
        });

        return finalObj;
    }, [currentTextures, fetchedCategories, activeTab]);

    // Reset category selection when switching tabs to avoid showing "No Materials Found"
    useEffect(() => {
        setSelectedCategory("All");
    }, [activeTab]);

    const filteredTextures = useMemo(() => {
        if (selectedCategory === "All") return currentTextures;
        return currentTextures.filter(t => t.id === "none" || (t.category || "General") === selectedCategory);
    }, [currentTextures, selectedCategory]);

    const selectedTextureName = useMemo(() => {
        const allTextures = [...predefinedTextures, ...uploadedTextures];
        const found = allTextures.find(t => t.id === selectedTextureId || (!selectedTextureId && localSelected === (t.id || t.name)));
        return found ? found.name : "None";
    }, [selectedTextureId, localSelected, predefinedTextures, uploadedTextures]);

    // Handle clicks outside to close menus
    useEffect(() => {
        const handleClickOutside = (e) => {
            // Three-dot menu closure (textures)
            if (menuOpenId && !e.target.closest('.menu-toggle-btn') && !e.target.closest('.context-menu-container')) {
                setMenuOpenId(null);
                setShowMoveTo(false);
            }

            // Close category dropdown if clicking outside
            if (isDropdownOpen && !e.target.closest('.category-dropdown-container') && !e.target.closest('.category-menu-container')) {
                setIsDropdownOpen(false);
            }

            // Close category context menu if clicking outside
            if (categoryMenuOpenId && !e.target.closest('.category-menu-toggle') && !e.target.closest('.category-menu-container')) {
                setCategoryMenuOpenId(null);
            }
        };
        window.addEventListener("mousedown", handleClickOutside);
        return () => window.removeEventListener("mousedown", handleClickOutside);
    }, [menuOpenId, isDropdownOpen, categoryMenuOpenId]);

    const handleEdit = (tex) => {
        setEditingTexture(tex);
        setIsEditModalOpen(true);
        setMenuOpenId(null);
    };

    const handleDelete = (tex) => {
        setAlertConfig({
            isOpen: true,
            type: 'texture',
            data: tex
        });
        setMenuOpenId(null);
    };

    const confirmAction = async () => {
        const { type, data } = alertConfig;
        if (!data) return;
        
        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
            
            if (type === 'texture') {
                const response = await axios.delete(`${backendUrl}/api/textures/delete/${data.id}`);
                if (response.status === 200) {
                    fetchUploadedTextures();
                }
            } else if (type === 'category') {
                const response = await axios.delete(`${backendUrl}/api/textures/categories/delete/${data.id}`);
                if (response.status === 200) {
                    fetchUploadedTextures();
                    fetchCategories();
                    setSelectedCategory("All");
                }
            } else if (type === 'clear') {
                const response = await axios.post(`${backendUrl}/api/textures/categories/clear/${data.id}`);
                if (response.status === 200) {
                    fetchUploadedTextures();
                }
            }
            
            setAlertConfig({ isOpen: false, type: 'texture', data: null });
        } catch (error) {
            console.error(`Error performing ${type} action:`, error);
            setAlertConfig({ isOpen: false, type: 'texture', data: null });
        }
    };

    const handleCategoryAction = (id, type) => {
        const cat = fetchedCategories.find(c => c._id === id);
        if (!cat) return;

        if (type === 'rename') {
            setRenamingCategoryId(id);
            setRenameValue(cat.name);
            setCategoryMenuOpenId(null);
        } else if (type === 'clear') {
            setAlertConfig({ isOpen: true, type: 'clear', data: { id, name: cat.name } });
            setCategoryMenuOpenId(null);
        } else if (type === 'delete') {
            setAlertConfig({ isOpen: true, type: 'category', data: { id, name: cat.name } });
            setCategoryMenuOpenId(null);
        }
    };

    const submitRename = async () => {
        if (!renameValue.trim() || !renamingCategoryId) return;
        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
            await axios.put(`${backendUrl}/api/textures/categories/rename/${renamingCategoryId}`, { name: renameValue });
            fetchCategories();
            fetchUploadedTextures();
            setRenamingCategoryId(null);
        } catch (error) {
            console.error("Error renaming category:", error);
        }
    };

    const handleMoveTo = async (tex, newCategory) => {
        try {
            const userStr = localStorage.getItem("user");
            const user = userStr ? JSON.parse(userStr) : null;
            if (!user?.emailId) return;

            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
            await axios.put(`${backendUrl}/api/textures/update/${tex.id}`, {
                email: user.emailId,
                materialCategory: newCategory
            });
            fetchUploadedTextures();
        } catch (error) {
            console.error("Error moving texture:", error);
        }
    };

    const handleSelect = (tex) => {
        // If clicking 'none' (remove texture), just apply it immediately
        if (tex.id === 'none') {
            applyTexture(tex);
            return;
        }

        // If no texture is currently applied, apply it immediately
        if (!selectedTextureId || selectedTextureId === 'none') {
            applyTexture(tex);
            return;
        }

        // If clicking the SAME texture that is already applied, do nothing or just re-apply
        if (selectedTextureId === tex.id) {
            return;
        }

        // A texture is already applied and a DIFFERENT one is selected - show confirmation
        setPendingTexture(tex);
    };

    const applyTexture = (tex) => {
        setLocalSelected(tex.id || tex.name);
        if (onSelectTexture) {
            onSelectTexture(tex);
        }
        setPendingTexture(null);
    };

    const scrollLeft = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: -(window.innerWidth * 0.1042), behavior: "smooth" });
        }
    };

    const scrollRight = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: (window.innerWidth * 0.1042), behavior: "smooth" });
        }
    };

    return (
        <>
            <div 
            className={`absolute left-1/2 -translate-x-1/2 z-20 transition-all duration-500 ease-in-out bg-white shadow-[0_10px_40px_rgba(0,0,0,0.15)] border border-gray-100 ${isDropdownOpen ? "overflow-visible" : "overflow-hidden"}
            ${isOpen ? "bottom-0 w-[97%] h-[12.5vw] rounded-t-[1vw]" : "bottom-0 w-[97%] h-[3.13vw] rounded-t-[0.83vw] cursor-pointer hover:bg-gray-50"}
            `}
            onClick={(e) => !isOpen && setIsOpen(true)}
        >
            {/* COLLAPSED STATE CONTENT */}
            <div 
                className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${isOpen ? "opacity-0 pointer-events-none" : "opacity-100"}`}
            >
                <span className="text-[0.8vw] font-semibold text-gray-700">Click to View Texture Gallery</span>
                <button 
                    className="absolute right-[0.62vw] top-1/2 -translate-y-1/2 w-[1.88vw] h-[1.88vw] cursor-pointer flex items-center justify-center bg-white border border-gray-200 rounded-[0.42vw] shadow-sm text-gray-600 hover:text-gray-900"
                >
                    <Icon icon="heroicons:chevron-up-20-solid" width="1.04vw" height="1.04vw" />
                </button>
            </div>

            {/* EXPANDED STATE CONTENT */}
            <div 
                className={`w-full h-full flex flex-col transition-opacity duration-500 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            >
                {/* Header / Toolbar */}
                <div className="flex items-center justify-between px-[1.25vw] pt-[1vw] pb-[0.5vw]">
                    <div className="flex items-center gap-[1.5vw]">
                        {/* Primary Mode Tabs: Texture Material vs Color Material */}
                        <div className="flex bg-[#f3f4f6] p-[0.3vw] rounded-[0.5vw] border border-gray-100 gap-[0.3vw]">
                            <button 
                                onClick={() => setMainTab("texture")}
                                className={`px-[0.8vw] py-[0.3vw] text-[0.65vw] font-semibold rounded-[0.4vw] transition-all duration-200 ${
                                    mainTab === "texture" 
                                        ? "bg-black text-white shadow-sm" 
                                        : "bg-white cursor-pointer text-[#9ca3af] hover:text-gray-600 shadow-sm"
                                }`}
                            >
                                Texture Material
                            </button>
                            <button 
                                onClick={() => setMainTab("color")}
                                className={`px-[0.8vw] py-[0.3vw] text-[0.65vw] font-semibold rounded-[0.4vw] transition-all duration-200 ${
                                    mainTab === "color" 
                                        ? "bg-black text-white shadow-sm" 
                                        : "bg-white cursor-pointer text-[#9ca3af] hover:text-gray-600 shadow-sm"
                                }`}
                            >
                                Color Material
                            </button>
                        </div>

                        {/* Sub-Tabs (Predefined / Uploaded) - ONLY visible when mainTab === "texture" */}
                        {mainTab === "texture" && (
                            <div className="flex bg-[#f3f4f6] p-[0.3vw] rounded-[0.5vw] border border-gray-100 gap-[0.3vw] animate-in fade-in duration-200">
                                <button 
                                    onClick={() => setActiveTab("predefined")}
                                    className={`px-[0.8vw] py-[0.3vw] text-[0.65vw] font-semibold rounded-[0.4vw] transition-all duration-200 ${activeTab === "predefined" ? "bg-black text-white shadow-sm" : "bg-white cursor-pointer text-[#9ca3af] hover:text-gray-600 shadow-sm"}`}
                                >
                                    Predefined
                                </button>
                                <button 
                                    onClick={() => setActiveTab("uploaded")}
                                    className={`px-[0.8vw] py-[0.3vw] text-[0.65vw] font-semibold rounded-[0.4vw] transition-all duration-200 ${activeTab === "uploaded" ? "bg-black text-white shadow-sm" : "bg-white cursor-pointer text-[#9ca3af] hover:text-gray-600 shadow-sm"}`}
                                >
                                    Uploaded
                                </button>
                            </div>
                        )}

                        {/* Material Category Selector - ONLY visible when mainTab === "texture" */}
                        {mainTab === "texture" && (
                            <div className="flex items-center gap-[0.7vw] animate-in fade-in duration-200">
                                <span className="text-[0.7vw] font-semibold text-gray-800">Material Category :</span>
                                <div 
                                    onClick={(e) => { e.stopPropagation(); setIsDropdownOpen(!isDropdownOpen); }}
                                    className="relative px-[0.8vw] py-[0.4vw] bg-[#f3f4f6] rounded-[0.5vw] border border-gray-100 flex items-center justify-between min-w-[8vw] cursor-pointer hover:bg-gray-100 transition-colors category-dropdown-container"
                                >
                                    <span className="text-[0.7vw] font-semibold text-gray-800 capitalize">{selectedCategory} ({categories[selectedCategory] || 0})</span>
                                    <Icon icon="heroicons:chevron-down-20-solid" width="0.8vw" className={`text-gray-500 transition-transform ${isDropdownOpen ? "rotate-180 text-black" : ""}`} />
                                    
                                    {/* Dropdown Menu */}
                                    <div className={`absolute bottom-full left-0 mb-[0.3vw] bg-white border border-gray-100 rounded-[0.6vw] shadow-xl transition-all z-40 min-w-full max-h-[7.5vw] overflow-y-auto custom-scrollbar ${isDropdownOpen ? "opacity-100 visible translate-y-0" : "opacity-0 invisible translate-y-2"}`}>
                                    {Object.entries(categories).map(([cat, count]) => {
                                        const isSelected = cat === selectedCategory;
                                        const catData = fetchedCategories.find(c => c.name === cat);
                                        
                                        return (
                                            <div 
                                                key={cat}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedCategory(cat);
                                                    setIsDropdownOpen(false);
                                                }}                                            
                                                className={`px-[0.8vw] py-[0.5vw] text-[0.65vw] font-semibold transition-colors cursor-pointer flex items-center justify-between group/cat-item ${
                                                    isSelected 
                                                        ? "bg-[#5d5efc] text-white" 
                                                        : "text-gray-600 hover:bg-gray-100"
                                                }`}
                                            >
                                                {renamingCategoryId === catData?._id ? (
                                                    <div className="flex items-center gap-[0.3vw] flex-1" onClick={(e) => e.stopPropagation()}>
                                                        <input 
                                                            autoFocus
                                                            className="bg-white text-black px-[0.4vw] py-[0.1vw] rounded-[0.2vw] w-full"
                                                            value={renameValue}
                                                            onChange={(e) => setRenameValue(e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') submitRename();
                                                                if (e.key === 'Escape') setRenamingCategoryId(null);
                                                            }}
                                                        />
                                                    </div>
                                                ) : (
                                                    <span>{cat} ({count})</span>
                                                )}
                                                
                                                {/* Three-dot menu for category (Only for user categories, skip "All") */}
                                                {cat !== "All" && activeTab === "uploaded" && catData && !renamingCategoryId && (
                                                    <button 
                                                        className={`w-[1.1vw] h-[1.1vw] rounded-[0.3vw] flex items-center justify-center category-menu-toggle transition-all ${isSelected ? "text-white hover:bg-white/20" : "text-gray-400 opacity-0 group-hover/cat-item:opacity-100 hover:bg-gray-200"}`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const rect = e.currentTarget.getBoundingClientRect();
                                                            setCategoryMenuPosition({ x: rect.left, y: rect.top });
                                                            setCategoryMenuOpenId(categoryMenuOpenId === catData._id ? null : catData._id);
                                                        }}
                                                    >
                                                        <Icon icon="heroicons:ellipsis-vertical-20-solid" width="0.8vw" />
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Selected Info & Close (Right) */}
                    <div className="flex items-center gap-[1.5vw]">
                        {/* Confirmation Buttons (Moved Here) */}
                        {pendingTexture && mainTab === "texture" && (
                            <div className="flex items-center gap-[0.6vw] animate-in fade-in slide-in-from-right-2 duration-300">
                                <span className="text-[0.7vw] font-semibold text-gray-800">Replace Texture :</span>
                                <div className="flex items-center gap-[0.4vw]">
                                    <button
                                        onClick={() => applyTexture(pendingTexture)}
                                        className="w-[1.8vw] h-[1.8vw] bg-[#34a853] text-white rounded-[0.4vw] flex items-center justify-center hover:bg-[#2d9147] transition-all shadow-sm cursor-pointer"
                                    >
                                        <Icon icon="heroicons:check-20-solid" width="1.1vw" height="1.1vw" />
                                    </button>
                                    <button
                                        onClick={() => setPendingTexture(null)}
                                        className="w-[1.8vw] h-[1.8vw] bg-[#f3f4f6] text-gray-400 rounded-[0.4vw] flex items-center justify-center hover:bg-gray-200 transition-all shadow-sm cursor-pointer"
                                    >
                                        <Icon icon="heroicons:x-mark-20-solid" width="1.1vw" height="1.1vw" />
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-[0.8vw]">
                            <span className="text-[0.7vw] font-semibold text-gray-800">
                                {mainTab === "color" ? "Selected Color :" : "Selected Texture :"}
                            </span>
                            <div className="px-[0.8vw] py-[0.4vw] bg-[#f3f4f6] rounded-[0.5vw] border border-gray-100 min-w-[7vw] flex items-center justify-center">
                                <span className="text-[0.7vw] font-semibold text-black">
                                    {mainTab === "color" 
                                        ? selectedColorName 
                                        : (pendingTexture ? pendingTexture.name : selectedTextureName)}
                                </span>
                            </div>
                        </div>
                        {/* Close Button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsOpen(false);
                            }}
                            className="w-[1.67vw] h-[1.67vw] cursor-pointer flex items-center justify-center bg-white border border-gray-200 rounded-[0.42vw] hover:bg-gray-50 text-gray-600 transition-all shadow-sm"
                        >
                            <Icon icon="heroicons:chevron-down-20-solid" width="0.94vw" height="0.94vw" />
                        </button>
                    </div>
                </div>

                {/* Gallery Scroll Area */}
                <div className="flex-1 relative flex items-center px-[1.2vw] gap-[1.5vw]">
                    {/* NEW: Upload Box (Only for Uploaded Tab in Texture mode) */}
                    {mainTab === "texture" && activeTab === "uploaded" && (
                        <div 
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onAddMaterialClick) onAddMaterialClick();
                            }}
                            className="flex flex-col items-center gap-[0.4vw] cursor-pointer group transition-all duration-300 ml-[0.2vw] shrink-0"
                        >
                            <div className="w-[7.5vw] h-[6vw] rounded-[0.8vw] border-[0.12vw] border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center relative overflow-hidden group-hover:border-[#5d5efc] transition-all shadow-sm">
                                <div className="flex flex-col items-center gap-[0.4vw] z-10">
                                    <Icon 
                                        icon="heroicons:plus-20-solid" 
                                        width="1.8vw" 
                                        height="1.8vw" 
                                        className="text-gray-400 group-hover:text-[#5d5efc] transition-all" 
                                    />
                                    <span className="text-[0.6vw] font-semibold text-gray-500 group-hover:text-gray-700">Click to Add Material</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Left Nav */}
                    <button 
                        onClick={scrollLeft}
                        className="z-10 w-[1.67vw] h-[1.67vw] flex flex-shrink-0 items-center justify-center bg-white hover:bg-gray-50 border border-gray-200 rounded-full shadow-sm text-gray-600 transition-all -translate-y-[0.62vw] mr-[0.5vw]"
                    >
                        <Icon icon="heroicons:chevron-left-20-solid" width="1.04vw" height="1.04vw" />
                    </button>

                    {/* Scrollable List */}
                    <div 
                        ref={scrollRef}
                        className="flex-1 overflow-x-auto custom-scrollbar px-[0.83vw] h-full flex items-center"
                    >
                        <div className="flex items-center gap-[1.2vw] min-w-max mx-auto px-[1vw] py-[1.2vw]">
                            {mainTab === "color" ? (
                                colorMaterials.map((col) => {
                                    const activeColorVal = selectedColorState || selectedColor;
                                    const isSelected = activeColorVal && activeColorVal.toLowerCase() === col.hex.toLowerCase();

                                    const isMetallic = col.metallic >= 70;
                                    const isEmissive = col.emissiveIntensity > 0;
                                    const isRough = col.roughness >= 70;

                                    const sphereBg = isMetallic
                                        ? `radial-gradient(circle at 28% 22%, #ffffff 0%, ${col.light} 28%, ${col.hex} 60%, ${col.dark} 100%)`
                                        : isRough
                                        ? `radial-gradient(circle at 45% 45%, ${col.light} 0%, ${col.hex} 70%, ${col.dark} 100%)`
                                        : `radial-gradient(circle at 35% 30%, ${col.light}, ${col.hex} 55%, ${col.dark} 100%)`;

                                    const sphereShadow = isEmissive
                                        ? `0 0 12px ${col.hex}, inset -2px -4px 6px rgba(0,0,0,0.3)`
                                        : isMetallic
                                        ? `inset -2px -4px 6px rgba(0,0,0,0.5), 0 4px 10px rgba(0,0,0,0.25)`
                                        : `inset -2px -4px 6px rgba(0,0,0,0.45), 0 4px 8px rgba(0,0,0,0.2)`;

                                    const pbrTooltip = `${col.name}\nBase Color: ${col.color}\nNormal: ${col.normal}%\nRoughness: ${col.roughness}%\nMetalness: ${col.metallic}%\nAmbient Occlusion: ${col.ao}%\nEmissive: ${col.emissiveIntensity}%\nHeight (Bump): ${col.bump}%`;

                                    return (
                                        <div 
                                            key={col.id} 
                                            className="flex flex-col items-center gap-[0.2vw] cursor-pointer group transition-all duration-300 relative"
                                            style={{ width: "4.5vw" }}
                                            title={pbrTooltip}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedColorState(col.hex);
                                                if (onSelectColor) onSelectColor(col);
                                            }}
                                        >
                                            <div
                                                className={`relative transition-all duration-500 ease-out shadow-md overflow-hidden bg-[#f3f4f6] border border-gray-200/60 flex items-center justify-center p-[0.3vw] ${
                                                    isSelected
                                                        ? "w-[4.17vw] h-[4.17vw] rounded-[0.8vw] z-20 scale-[1.35] shadow-[0_4px_20px_rgba(0,0,0,0.15)] border-gray-300"
                                                        : "w-[4.17vw] h-[4.17vw] rounded-[0.8vw] group-hover:scale-110 z-0"
                                                }`}
                                            >
                                                <div 
                                                    className="w-full h-full rounded-full transition-transform duration-500"
                                                    style={{
                                                        background: sphereBg,
                                                        boxShadow: sphereShadow
                                                    }}
                                                />
                                                {/* Subtle Specular Highlight */}
                                                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
                                            </div>
                                            <span
                                                className={`text-[0.6vw] font-bold text-center w-full truncate transition-all duration-500 ease-out mt-[0.5vw] ${
                                                    isSelected ? "text-[#5d5efc] translate-y-[0.8vw]" : "text-gray-600 translate-y-0"
                                                }`}
                                            >
                                                {col.name}
                                            </span>
                                        </div>
                                    );
                                })
                            ) : (
                                <>
                                    {filteredTextures.length === 0 && (
                                        <div className="flex items-center justify-center py-[2vw]">
                                            <span className="text-[0.75vw] text-gray-400/80 font-semibold tracking-wide flex items-center gap-[0.5vw]">
                                                <Icon icon="heroicons:information-circle-20-solid" width="1vw" />
                                                No Materials Found
                                            </span>
                                        </div>
                                    )}

                                    {filteredTextures.map((tex, idx) => {
                                        const isActive = selectedTextureId === tex.id || (!selectedTextureId && localSelected === (tex.id || tex.name));
                                        
                                        let imageSrc = resolveUploadsPath(tex.thumb || tex.preview);

                                        return (
                                            <div 
                                                key={idx} 
                                                className="flex flex-col items-center gap-[0.4vw] cursor-pointer group transition-all duration-300 relative"
                                                style={{ width: "4.5vw" }} // Fixed container width to prevent layout shift
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSelect(tex);
                                                }}
                                            >
                                                <div
                                                    className={`relative transition-all duration-500 ease-out shadow-md overflow-hidden bg-[#f3f4f6] border border-gray-200/60 ${
                                                        isActive
                                                        ? "w-[4.17vw] h-[4.17vw] rounded-[0.8vw] z-20 scale-[1.35] shadow-[0_4px_20px_rgba(0,0,0,0.15)] border-gray-300"
                                                        : "w-[4.17vw] h-[4.17vw] rounded-[0.8vw] group-hover:scale-110 z-0"
                                                    }`}
                                                >
                                                    {tex.id === 'none' ? (
                                                        <div className="w-full h-full flex items-center justify-center bg-black text-white/40">
                                                            <Icon icon="mdi:block" width="2.5vw" height="2.5vw" />
                                                        </div>
                                                    ) : (
                                                        <img 
                                                            src={imageSrc} 
                                                            alt={tex.name} 
                                                            className={`w-full h-full object-cover p-[0.1vw] transition-transform duration-500 ${!isActive ? "group-hover:scale-95" : ""}`}
                                                            loading="lazy"
                                                        />
                                                    )}
                                                    {/* Subtle Inner Glow */}
                                                    <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />

                                                    {/* Three Dot Button (Only for Uploaded) */}
                                                    {activeTab === "uploaded" && (
                                                        <div 
                                                            className="absolute top-[0.3vw] right-[0.3vw] w-[1vw] h-[1vw] bg-white rounded-[0.75vw] flex items-center justify-center opacity-0 group-hover:opacity-100 shadow-lg hover:scale-110 active:scale-95 transition-all z-30 pointer-events-auto menu-toggle-btn"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const rect = e.currentTarget.getBoundingClientRect();
                                                                setMenuPosition({ 
                                                                    x: rect.left, 
                                                                    y: rect.top 
                                                                });
                                                                setMenuOpenId(menuOpenId === tex.id ? null : tex.id);
                                                                setShowMoveTo(false);
                                                            }}
                                                        >
                                                            <Icon icon="heroicons:ellipsis-vertical-20-solid" className="text-gray-500" width="0.9vw" />
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                <span
                                                    className={`text-[0.6vw] font-bold text-center w-full truncate transition-all duration-500 ease-out mt-[0.5vw] ${
                                                        isActive ? "text-[#5d5efc] translate-y-[0.8vw]" : "text-gray-500 translate-y-0"
                                                    }`}
                                                    title={tex.name}
                                                >
                                                    {tex.name}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Right Nav */}
                    <button 
                        onClick={scrollRight}
                        className="z-10 w-[1.67vw] h-[1.67vw] flex flex-shrink-0 items-center justify-center bg-white hover:bg-gray-50 border border-gray-200 rounded-full shadow-sm text-gray-600 transition-all ml-[0.5vw] -translate-y-[0.62vw]"
                    >
                        <Icon icon="heroicons:chevron-right-20-solid" width="1.04vw" height="1.04vw" />
                    </button>
                </div>
            </div>

            </div>

            {/* ADD/EDIT MATERIAL MODAL */}
            {isEditModalOpen && (
                <AddMaterial
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    editData={editingTexture}
                    onUpdateSuccess={fetchUploadedTextures}
                />
            )}

            <AlertModal
                isOpen={alertConfig.isOpen}
                onClose={() => setAlertConfig({ isOpen: false, type: 'texture', data: null })}
                onConfirm={confirmAction}
                type="error"
                title={alertConfig.type === 'texture' ? "Delete Material" : alertConfig.type === 'clear' ? "Clear Category" : "Delete Category"}
                message={
                    alertConfig.type === 'texture' 
                    ? `Are you sure you want to delete "${alertConfig.data?.name}"? This action cannot be undone.` 
                    : alertConfig.type === 'clear' 
                    ? `Remove all textures from category "${alertConfig.data?.name}"? This action cannot be undone.` 
                    : `Delete category "${alertConfig.data?.name}" and all its textures? This action cannot be undone.`
                }
                showCancel={true}
                confirmText={alertConfig.type === 'texture' ? "Delete" : alertConfig.type === 'clear' ? "Clear" : "Delete All"}
                cancelText="Cancel"
            />

            {/* CATEGORY CONTEXT MENU */}
            {categoryMenuOpenId && (
                <div 
                    className="fixed z-[99999] bg-white rounded-[0.85vw] shadow-[0_8px_30px_rgba(0,0,0,0.12)] border-[0.11vw] border-gray-400 py-[0.5vw] px-[0.3vw] min-w-[10vw] category-menu-container animate-in fade-in zoom-in duration-200"
                    style={{ 
                        top: (categoryMenuPosition.y - 120) + 'px', 
                        left: (categoryMenuPosition.x + 30) + 'px' 
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex flex-col gap-[0.1vw]">
                        <button 
                            onClick={() => handleCategoryAction(categoryMenuOpenId, 'rename')}
                            className="w-full flex items-center gap-[0.6vw] px-[0.8vw] py-[0.5vw] hover:bg-gray-100 cursor-pointer rounded-[0.6vw] text-gray-700 transition-colors group/item"
                        >
                            <Icon icon="mdi:edit-outline" className="w-[1.1vw] h-[1.1vw] text-gray-500" />
                            <span className="text-[0.7vw] font-medium text-gray-600">Rename</span>
                        </button>
                        
                        <button 
                            onClick={() => handleCategoryAction(categoryMenuOpenId, 'clear')}
                            className="w-full flex items-center gap-[0.6vw] px-[0.8vw] py-[0.5vw] hover:bg-gray-100 cursor-pointer rounded-[0.6vw] text-gray-700 transition-colors group/item"
                        >
                            <Icon icon="mdi:block" className="w-[1.1vw] h-[1.1vw] text-gray-500 rotate-90" />
                            <span className="text-[0.7vw] font-medium text-gray-600">Clear All</span>
                        </button>

                        <button 
                            onClick={() => handleCategoryAction(categoryMenuOpenId, 'delete')}
                            className="w-full flex items-center gap-[0.6vw] px-[0.8vw] py-[0.5vw] hover:bg-red-100 cursor-pointer rounded-[0.6vw] text-red-500 transition-colors"
                        >
                            <Icon icon="solar:trash-bin-trash-linear" className="w-[1.1vw] h-[1.1vw]" />
                            <span className="text-[0.7vw] font-medium">Delete Category</span>
                        </button>
                    </div>
                </div>
            )}

            {/* SHARED OPTIONS MENU (Reduced size) */}
            {menuOpenId && (
                <div 
                    className="fixed z-[99999] bg-white rounded-[0.85vw] shadow-[0_8px_30px_rgba(0,0,0,0.12)] border-[0.11vw] border-gray-400 py-[0.5vw] px-[0.3vw] min-w-[10vw] context-menu-container animate-in fade-in zoom-in duration-200"
                    style={{ 
                        top: (menuPosition.y - 120) + 'px', 
                        left: (menuPosition.x + 20) + 'px' 
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {(() => {
                        const tex = uploadedTextures.find(t => String(t.id) === String(menuOpenId));
                        if (!tex) return null;
                        
                        return (
                            <div className="flex flex-col gap-[0.1vw]">
                                <button 
                                    onClick={() => { handleEdit(tex); setMenuOpenId(null); }}
                                    className="w-full flex items-center gap-[0.6vw] px-[0.8vw] py-[0.5vw] hover:bg-gray-100 cursor-pointer rounded-[0.6vw] text-gray-700 transition-colors group/item"
                                >
                                    <Icon icon="mdi:edit-outline" className="w-[1.1vw] h-[1.1vw] text-gray-500" />
                                    <span className="text-[0.7vw] font-medium text-gray-600">Edit Material</span>
                                </button>
                                
                                <div 
                                    className="relative"
                                    onMouseEnter={() => setShowMoveTo(true)}
                                    onMouseLeave={() => setShowMoveTo(false)}
                                >
                                    <button 
                                        className={`w-full flex items-center justify-between gap-[0.6vw] px-[0.8vw] py-[0.5vw] rounded-[0.6vw] transition-colors group/item ${showMoveTo ? 'bg-gray-100' : 'hover:bg-gray-100 cursor-pointer'}`}
                                    >
                                        <div className="flex items-center gap-[0.6vw]">
                                            <Icon icon="solar:login-3-linear" className="w-[1.1vw] h-[1.1vw] text-gray-500" />
                                            <span className="text-[0.7vw] font-medium text-gray-600">Move to</span>
                                        </div>
                                    </button>

                                    {/* Category Submenu - Added gap and transparent bridge for stable hover */}
                                    {showMoveTo && (
                                        <div 
                                            className="absolute left-full top-[-1vw] ml-[0.75vw] bg-white rounded-[0.85vw] shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-[0.11vw] border-gray-400 py-[0.5vw] px-[0.3vw] min-w-[10vw] max-h-[14vw] overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-left-2 duration-200 z-50 pointer-events-auto"
                                        >
                                            {/* Transparent bridge to prevent closure when moving mouse across the gap */}
                                            <div className="absolute top-0 right-full w-[0.8vw] h-full" />
                                            
                                            <div className="flex flex-col gap-[0.1vw]">
                                                {Object.keys(categories).filter(c => c !== "All").map(cat => {
                                                    const isCurrent = cat === tex.category;
                                                    return (
                                                        <button 
                                                            key={cat}
                                                            disabled={isCurrent}
                                                            onClick={() => { handleMoveTo(tex, cat); setMenuOpenId(null); }}
                                                            className={`w-full text-left px-[0.8vw] py-[0.5vw] rounded-[0.6vw] transition-colors text-[0.7vw] font-medium capitalize 
                                                                ${isCurrent ? "opacity-40 cursor-not-allowed bg-gray-50 text-gray-400" : "hover:bg-gray-100 cursor-pointer text-gray-600"}`}
                                                        >
                                                            {cat} {isCurrent && "(Current)"}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <button 
                                    onClick={() => { handleDelete(tex); setMenuOpenId(null); }}
                                    className="w-full flex items-center gap-[0.6vw] px-[0.8vw] py-[0.5vw] hover:bg-red-100 cursor-pointer rounded-[0.6vw] text-red-500 transition-colors"
                                >
                                    <Icon icon="solar:trash-bin-trash-linear" className="w-[1.1vw] h-[1.1vw]" />
                                    <span className="text-[0.7vw] font-medium">Delete Material</span>
                                </button>
                            </div>
                        );
                    })()}
                </div>
            )}
        </>
    );
}
