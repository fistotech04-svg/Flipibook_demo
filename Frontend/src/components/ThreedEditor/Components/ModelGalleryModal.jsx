import React, { useState, useEffect, useRef, Suspense, useMemo, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Icon } from "@iconify/react";
import { Canvas } from "@react-three/fiber";
import { View, OrbitControls, Environment, PerspectiveCamera, Html } from "@react-three/drei";
import axios from "axios";
import RenderModel from "./ModelLoaders";
import AlertModal from "../../AlertModal";
import { useToast } from "../../../components/CustomToast";
import { resolveUploadsPath } from "../../../utils/supabaseUtils";

class ThumbnailErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError() {
        return { hasError: true };
    }
    componentDidCatch(err) {
        console.warn("[GalleryThumbnail] Model preview error:", err?.message || err);
    }
    render() {
        if (this.state.hasError) {
            return (
                <mesh>
                    <boxGeometry args={[1, 1, 1]} />
                    <meshStandardMaterial color="#888888" roughness={0.5} />
                </mesh>
            );
        }
        return this.props.children;
    }
}

// Internal component for 3D thumbnail with support for static images
const ModelThumbnail = React.memo(({ model }) => {
    const viewRef = useRef();
    const [isInView, setIsInView] = useState(false);
    const [isFullyLoaded, setIsFullyLoaded] = useState(false);
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    
    // Support for static thumbnails if backend provides them
    const thumbnailPath = model.thumbnail || model.image || model.preview;
    const fullThumbnailUrl = thumbnailPath ? resolveUploadsPath(thumbnailPath) : null;
    const fullUrl = model.url ? resolveUploadsPath(model.url) : '';


    useEffect(() => {
        if (!viewRef.current || fullThumbnailUrl) return;
        
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsInView(entry.isIntersecting);
            },
            { threshold: 0.1 }
        );
        
        observer.observe(viewRef.current);
        return () => observer.disconnect();
    }, [fullThumbnailUrl, fullUrl]);

    if (fullThumbnailUrl) {
        return (
            <div className="w-full h-full relative group">
                <img 
                    src={fullThumbnailUrl} 
                    alt={model.name}
                    className="w-full h-full object-contain p-[1vw] transition-transform duration-500 group-hover:scale-110"
                    onLoad={() => setIsFullyLoaded(true)}
                    onError={(e) => {
                        e.target.style.display = 'none';
                        setIsInView(true);
                    }}
                />
                {!isFullyLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-500/10">
                        <div className="w-[1vw] h-[1vw] border-[0.15vw] border-gray-200 border-t-indigo-500 rounded-full animate-spin" />
                    </div>
                )}
            </div>
        );
    }
    
    return (
        <div ref={viewRef} className="w-full h-full relative group bg-gray-500">
            {isInView ? (
                <Canvas style={{ width: '100%', height: '100%', background: 'transparent' }} camera={{ fov: 35, position: [0, 1, 5] }}>
                    <Suspense fallback={
                        <Html center className="pointer-events-none">
                            <div className="flex flex-col items-center justify-center gap-[0.5vw]">
                                <div className="w-[1.4vw] h-[1.4vw] border-[0.2vw] border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span className="text-[0.6vw] font-medium text-white/80">Loading...</span>
                            </div>
                        </Html>
                    }>
                        <ambientLight intensity={1.5} />
                        <pointLight position={[10, 10, 10]} intensity={1.5} />
                        <directionalLight position={[-5, 5, 5]} intensity={1} />
                        
                        <group position={[0, -0.6, 0]}>
                            <ThumbnailErrorBoundary>
                                <RenderModel
                                    type={model.type}
                                    url={fullUrl}
                                    isSelectionDisabled={true}
                                    shouldClone={true}
                                />
                            </ThumbnailErrorBoundary>
                        </group>
                        
                        <Environment preset="studio" />
                        
                        <OrbitControls 
                            enableZoom={false} 
                            enablePan={false}
                            enableRotate={false}
                            target={[0, 0, 0]}
                            autoRotate={false}
                        />
                    </Suspense>
                </Canvas>
            ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                     <Icon icon="ph:sketch-logo-thin" className="w-[2vw] h-[2vw] text-gray-400 opacity-30" />
                </div>
            )}
        </div>
    );
});

export default function ModelGalleryModal({ isOpen, onClose, onSelectModel, hideDelete, loadedModels = [], onClearModel }) {
    const navigate = useNavigate();
    const { modelId: urlModelId } = useParams();
    const [models, setModels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedModel, setSelectedModel] = useState(null);
    const [selectedForDeletion, setSelectedForDeletion] = useState([]);
    const toast = useToast();
    const containerRef = useRef();

    // Guard alerts for currently-in-use model
    const [inUseReplaceAlert, setInUseReplaceAlert] = useState(null);  // { model }
    const [inUseDeleteAlert, setInUseDeleteAlert]   = useState(null);  // { model }

    // Derive a Set of name keys that are currently loaded in the editor
    const loadedModelNames = useMemo(() =>
        new Set((loadedModels || []).map(m => (m.name || '').replace(/\.[^/.]+$/, '').toLowerCase())),
        [loadedModels]
    );

    const isModelInUse = useCallback((model) => {
        if (!model) return false;
        const galleryName = (model.name || '').replace(/\.[^/.]+$/, '').toLowerCase();
        const galleryId = model.modelId ? String(model.modelId) : null;

        // 1. Check against active URL model ID
        if (galleryId && urlModelId && galleryId === String(urlModelId)) {
            return true;
        }

        // 2. Check against loaded models currently in editor
        if (loadedModels && loadedModels.length > 0) {
            return loadedModels.some(m => {
                const mName = (m.name || '').replace(/\.[^/.]+$/, '').toLowerCase();
                const mId = m.modelId ? String(m.modelId) : (m.id ? String(m.id) : null);
                if (galleryId && mId && galleryId === mId) return true;
                if (galleryName && mName && galleryName === mName) return true;
                return false;
            });
        }

        return loadedModelNames.has(galleryName);
    }, [loadedModels, loadedModelNames, urlModelId]);

    // Regular delete alert for non-in-use models
    const [alertConfig, setAlertConfig] = useState({ isOpen: false, data: null });

    useEffect(() => {

        if (isOpen) {
            fetchModels();
        }
    }, [isOpen]);

    const fetchModels = async () => {
        try {
            setLoading(true);
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                const user = JSON.parse(storedUser);
                const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
                const response = await axios.get(`${backendUrl}/api/3d-models/get-models`, {
                    params: { emailId: user.emailId }
                });
                setModels(response.data.models || []);
            }
        } catch (error) {
            console.error("Failed to fetch models:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const filteredModels = models.filter(m => 
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        (m.type?.toLowerCase() === 'glb' || m.url?.toLowerCase().endsWith('.glb'))
    );

    const handleReplaceClick = () => {
        if (!selectedModel) return;
        // If the selected model is currently active in the editor, show a guard alert
        if (isModelInUse(selectedModel)) {
            setInUseReplaceAlert({ model: selectedModel });
            return;
        }
        onSelectModel(selectedModel);
        onClose();
    };

    const handleDeleteModel = async (model) => {
        const userStr = localStorage.getItem('user');
        if (!userStr || !model) {
            console.warn("Cannot delete: User session or model data missing");
            return;
        }
        const user = JSON.parse(userStr);
        const wasInUse = isModelInUse(model);
        
        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
            const email = encodeURIComponent(user.emailId);
            const deleteUrl = `${backendUrl}/api/3d-models/delete-model/${email}/${model.modelId}`;
            
            console.log("Attempting to delete model:", model.name);
            console.log(`Target User: ${user.emailId}, ID: ${model.modelId}`);
            console.log(`Action URL: ${deleteUrl}`);

            const response = await axios.delete(deleteUrl);
            
            console.log("Delete response:", response.data);
            toast.success("Model deleted from gallery and database");
            
            // Refresh local list
            fetchModels();
            if (selectedModel?.name === model.name) setSelectedModel(null);

            // If the deleted model was currently open/used in the editor, redirect to /editor/threed_editor
            if (wasInUse) {
                if (onClose) onClose();
                if (onClearModel) {
                    onClearModel();
                }
                navigate("/editor/threed_editor", { replace: true });
            }
            
        } catch (error) {
            console.error("Delete operation failed!");
            console.error("Context:", { 
                email: user.emailId,
                modelId: model.modelId,
                status: error.response?.status,
                data: error.response?.data 
            });
            toast.error("Failed to delete model from database");
        } finally {
            setAlertConfig({ isOpen: false, data: null });
        }
    };

    const handleDeleteMultipleModels = async (modelsToDelete) => {
        const userStr = localStorage.getItem('user');
        if (!userStr || !modelsToDelete || modelsToDelete.length === 0) return;
        const user = JSON.parse(userStr);
        const hasInUse = modelsToDelete.some(m => isModelInUse(m));
        
        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
            const email = encodeURIComponent(user.emailId);
            
            await Promise.all(modelsToDelete.map(model => 
                axios.delete(`${backendUrl}/api/3d-models/delete-model/${email}/${model.modelId}`)
            ));
            
            toast.success(`${modelsToDelete.length} model(s) deleted successfully`);
            
            fetchModels();
            setSelectedForDeletion([]);
            if (modelsToDelete.some(m => m.name === selectedModel?.name)) {
                setSelectedModel(null);
            }

            // If any of the deleted models was currently open/used in the editor, redirect to /editor/threed_editor
            if (hasInUse) {
                if (onClose) onClose();
                if (onClearModel) {
                    onClearModel();
                }
                navigate("/editor/threed_editor", { replace: true });
            }
            
        } catch (error) {
            console.error("Multiple delete failed:", error);
            toast.error("Failed to delete some models");
        } finally {
            setAlertConfig({ isOpen: false, data: null, isMultiple: false });
        }
    };



    if (!isOpen) return null;

    return (
        <div className="fixed top-[8vh] left-0 right-0 bottom-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-300">
            <div className="bg-white w-[70vw] h-[40vw] max-h-[85vh] rounded-[0.75vw] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header Section */}
                <div className="p-[1.5vw] pb-[1vw] flex items-start justify-between">
                    <div>
                        <h2 className="text-[1.35vw] font-bold text-gray-800 tracking-tight">3D Model Gallery</h2>
                        <p className="text-[0.75vw] text-gray-500 mt-[0.2vw] font-medium">Select a professional popup design to get start</p>
                    </div>
                    <div className="flex items-center gap-[0.75vw] pt-[0.25vw]">
                        {filteredModels.length > 0 && selectedForDeletion.length < filteredModels.length && !hideDelete && (
                            <button 
                                onClick={() => setSelectedForDeletion([...filteredModels])}
                                className="flex items-center gap-[0.4vw] px-[1vw] py-[0.5vw] bg-white border border-gray-300 rounded-full text-[0.8vw] font-medium text-gray-700 hover:bg-gray-50 transition-all cursor-pointer"
                            >
                                <Icon icon="lucide:check-square" className="w-[1vw] h-[1vw]" />
                                Select All
                            </button>
                        )}
                        {filteredModels.length > 0 && selectedForDeletion.length === filteredModels.length && !hideDelete && (
                            <button 
                                onClick={() => setSelectedForDeletion([])}
                                className="flex items-center gap-[0.4vw] px-[1vw] py-[0.5vw] bg-white border border-gray-300 rounded-full text-[0.8vw] font-medium text-gray-700 hover:bg-gray-50 transition-all cursor-pointer"
                            >
                                <Icon icon="lucide:x-square" className="w-[1vw] h-[1vw]" />
                                Deselect All
                            </button>
                        )}
                        {selectedForDeletion.length > 0 && !hideDelete && (
                            <button 
                                onClick={() => setAlertConfig({ isOpen: true, data: selectedForDeletion, isMultiple: true })}
                                className="flex items-center gap-[0.4vw] px-[1vw] py-[0.5vw] bg-red-50 text-red-600 border border-red-200 rounded-full text-[0.8vw] font-medium hover:bg-red-100 transition-all cursor-pointer"
                            >
                                <Icon icon="solar:trash-bin-trash-bold" className="w-[1vw] h-[1vw]" />
                                Delete ({selectedForDeletion.length})
                            </button>
                        )}
                        {/* Search Bar */}
                        <div className="relative group">
                            <Icon 
                                icon="bitcoin-icons:search-outline" 
                                className="absolute left-[0.6vw] top-1/2 -translate-y-1/2 text-gray-400 w-[1.1vw] h-[1.1vw]" 
                            />
                            <input 
                                type="text" 
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-[2.2vw] pr-[1vw] py-[0.5vw] w-[20vw] bg-white border border-gray-300 rounded-full text-[0.8vw] focus:outline-none focus:border-indigo-500 transition-all"
                            />
                        </div>
                        {/* Filter Button */}
                        <button className="flex items-center gap-[0.4vw] px-[1vw] py-[0.5vw] border border-gray-300 rounded-full text-[0.8vw] font-medium text-gray-600 hover:bg-gray-50 cursor-pointer transition-all">
                            <Icon icon="mi:filter" className="w-[1vw] h-[1vw]" />
                            Filter
                        </button>
                    </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-gray-100 mx-[1.5vw]"></div>

                {/* Main Content Area */}
                <div ref={containerRef} className="flex-1 overflow-y-auto px-[1.5vw] py-[1.2vw] custom-scrollbar relative">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-[10vw]">
                            <div className="w-[2.1vw] h-[2.1vw] border-[0.3vw] border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"></div>
                            <p className="mt-4 text-[1vw] text-gray-500 font-medium">Fetching Models...</p>
                        </div>
                    ) : filteredModels.length > 0 ? (
                        <div className="grid grid-cols-5 gap-[1.2vw] pb-[2vw]">
                            {filteredModels.map((model, idx) => (
                                <div 
                                    key={idx}
                                    onClick={() => setSelectedModel(model)}
                                    className={`group cursor-pointer flex flex-col gap-[0.5vw] transition-all`}
                                >
                                    <div className={`relative w-full aspect-square rounded-[0.7vw] bg-gray-500 flex items-center justify-center border-2 transition-all overflow-hidden ${
                                        selectedModel?.name === model?.name
                                            ? 'border-indigo-500 shadow-md ring-1 ring-indigo-500/20' 
                                            : 'border-transparent hover:border-gray-200'
                                    }`}>
                                        {/* Live 3D View as Thumbnail */}
                                        <div className="w-full h-full">
                                            <ModelThumbnail 
                                                model={model} 
                                            />
                                        </div>

                                        {/* Status / Type Badge */}
                                        <div 
                                            className="absolute top-[0.4vw] left-[0.4vw] px-[0.5vw] py-[0.2vw] bg-white/95 backdrop-blur-md rounded-[0.3vw] shadow-sm border border-gray-200 flex items-center justify-center"
                                            style={{ zIndex: 130 }}
                                        >
                                            <span className="text-[0.6vw] font-bold text-gray-700 uppercase tracking-wide leading-none">{model.type?.replace('.', '') || '3D'}</span>
                                        </div>

                                        {/* Single Delete Trash Icon - Only on Hover */}
                                        {selectedForDeletion.length === 0 && !hideDelete && (
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    // Guard: model is currently loaded in editor
                                                    if (isModelInUse(model)) {
                                                        setInUseDeleteAlert({ model });
                                                    } else {
                                                        setAlertConfig({ isOpen: true, data: model, isMultiple: false });
                                                    }
                                                }}
                                                className="absolute top-[0.4vw] right-[0.4vw] w-[1.5vw] h-[1.5vw] cursor-pointer bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 hover:text-red-600 transition-all z-[140] shadow-md opacity-0 group-hover:opacity-100"
                                            >
                                                <Icon icon="solar:trash-bin-trash-bold" width="0.8vw" />
                                            </button>
                                        )}

                                        {/* Selection Checkbox */}
                                        {!hideDelete && (
                                            <div 
                                                className="absolute top-[0.4vw] right-[2.2vw] z-[135] cursor-pointer p-[0.2vw]"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedForDeletion(prev => 
                                                        prev.some(m => m.modelId === model.modelId)
                                                        ? prev.filter(m => m.modelId !== model.modelId)
                                                        : [...prev, model]
                                                    );
                                                }}
                                            >
                                                <div className={`w-[1.2vw] h-[1.2vw] rounded border flex items-center justify-center transition-all ${
                                                    selectedForDeletion.some(m => m.modelId === model.modelId)
                                                    ? 'bg-red-500 border-red-500 text-white'
                                                    : 'bg-white/80 border-gray-300 opacity-0 group-hover:opacity-100 shadow-sm'
                                                } ${selectedForDeletion.some(m => m.modelId === model.modelId) ? '!opacity-100' : ''}`}>
                                                    {selectedForDeletion.some(m => m.modelId === model.modelId) && (
                                                        <Icon icon="heroicons:check-16-solid" width="0.8vw" />
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="px-[0.2vw] flex items-center justify-between gap-[0.5vw] mb-[0.2vw]">
                                        <p 
                                            className="text-[0.8vw] font-semibold text-gray-700 truncate group-hover:text-indigo-600 transition-colors flex-1 min-w-0"
                                            title={model.name.replace(/\.[^/.]+$/, "")}
                                        >
                                            {model.name.replace(/\.[^/.]+$/, "")}
                                        </p>
                                        <div className="flex items-center gap-[0.3vw] shrink-0">
                                            {isModelInUse(model) && (
                                                <span className="text-[0.55vw] font-bold uppercase tracking-wide px-[0.4vw] py-[0.1vw] bg-green-100 text-green-700 rounded-full border border-green-200">
                                                    In Use
                                                </span>
                                            )}
                                            <span className="text-[0.65vw] text-gray-400 font-medium whitespace-nowrap">{model.size}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-[8vw] bg-gray-50/50 rounded-[1vw] border border-dashed border-gray-200 mx-auto">
                             <div className="p-[1.5vw] bg-gray-100 rounded-full mb-[1vw] text-gray-400">
                                 <Icon icon="solar:box-minimalistic-linear" width="3vw" height="3vw" />
                             </div>
                             <p className="text-[1.2vw] font-bold text-gray-800">3D Model not available in your gallery</p>
                             <p className="text-[0.85vw] text-gray-500 mt-[0.2vw]">Please upload a professional 3D model first to see it here</p>
                        </div>
                    )}
                </div>

                {/* Footer Section */}
                <div className="p-[1.5vw] pt-0 flex items-center justify-end gap-[0.75vw] mt-auto">
                    <button 
                        onClick={onClose}
                        className="flex items-center cursor-pointer gap-[0.5vw] px-[1.5vw] py-[0.6vw] border border-gray-300 rounded-[0.4vw] text-[0.85vw] font-semibold text-gray-800 hover:bg-gray-50 active:scale-95 transition-all"
                    >
                        Close
                    </button>
                    <button 
                        disabled={!selectedModel}
                        onClick={handleReplaceClick}
                        className={`flex items-center cursor-pointer gap-[0.5vw] px-[2vw] py-[0.6vw] rounded-[0.4vw] text-[0.85vw] font-semibold shadow-sm transition-all active:scale-95 ${
                            selectedModel 
                                ? 'bg-black text-white hover:bg-zinc-800' 
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                    >
                        Replace Model
                    </button>
                </div>

                <style>{`
                    .custom-scrollbar::-webkit-scrollbar {
                        width: 0.4vw;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: #d1d1d1;
                        border-radius: 1vw;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: #a1a1a1;
                    }
                `}</style>
            </div>

            {/* ── REGULAR DELETE ALERT (non-in-use model) ── */}
            <AlertModal 
                isOpen={alertConfig.isOpen}
                onClose={() => setAlertConfig({ isOpen: false, data: null, isMultiple: false })}
                onConfirm={() => {
                    if (alertConfig.isMultiple) {
                        handleDeleteMultipleModels(alertConfig.data);
                    } else {
                        handleDeleteModel(alertConfig.data);
                    }
                }}
                type="error"
                title={
                    alertConfig.isMultiple && alertConfig.data?.some(m => isModelInUse(m))
                        ? "Delete Selected Models (Active Model Included)?"
                        : "Delete Model"
                }
                message={
                    alertConfig.isMultiple 
                    ? (alertConfig.data?.some(m => isModelInUse(m))
                        ? `You have selected ${alertConfig.data?.length} model(s) including the model currently open in the editor.\n\nDeleting them will permanently remove them from your gallery and redirect the editor to an empty canvas. Are you sure you want to proceed?`
                        : `Are you sure you want to delete ${alertConfig.data?.length} selected models from your gallery? This action cannot be undone.`)
                    : `Are you sure you want to delete "${alertConfig.data?.name?.replace(/\.[^/.]+$/, "")}" from your gallery? This action cannot be undone.`
                }
                showCancel={true}
                confirmText="Delete"
            />

            {/* ── IN-USE REPLACE GUARD ALERT ── */}
            <AlertModal
                isOpen={!!inUseReplaceAlert}
                onClose={() => setInUseReplaceAlert(null)}
                onConfirm={() => {
                    const model = inUseReplaceAlert?.model;
                    setInUseReplaceAlert(null);
                    if (model) {
                        onSelectModel(model);
                        onClose();
                    }
                }}
                type="warning"
                title="Replace Active Model?"
                message={`"${inUseReplaceAlert?.model?.name?.replace(/\.[^/.]+$/, '') ?? ''}" is currently open in the editor.\n\nYour unsaved changes will be lost if you replace it. Do you still want to continue?`}
                showCancel={true}
                confirmText="Replace Anyway"
                cancelText="Cancel"
            />

            {/* ── IN-USE DELETE GUARD ALERT ── */}
            <AlertModal
                isOpen={!!inUseDeleteAlert}
                onClose={() => setInUseDeleteAlert(null)}
                onConfirm={() => {
                    const model = inUseDeleteAlert?.model;
                    setInUseDeleteAlert(null);
                    if (model) handleDeleteModel(model);
                }}
                type="error"
                title="Delete Active Model?"
                message={`"${inUseDeleteAlert?.model?.name?.replace(/\.[^/.]+$/, '') ?? ''}" is currently open in the editor.\n\nDeleting it will permanently remove it from your gallery and redirect the editor to an empty base (http://localhost:5173/editor/threed_editor). Are you sure you want to proceed?`}
                showCancel={true}
                confirmText="Delete Anyway"
                cancelText="Keep Model"
            />
        </div>
    );
}
