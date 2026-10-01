import React, { Suspense, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, PerspectiveCamera, Center } from "@react-three/drei";
import { Icon } from "@iconify/react";
import * as THREE from "three";
import { jsPDF } from "jspdf";
import RenderModel from "./ModelLoaders";
import ColorPicker from "../ColorPicker";
import axios from "axios";

export default function CameraModal({ 
    isOpen, 
    onClose, 
    models, 
    settings, 
    materialSettings, 
    transformValues,
    hiddenMaterials,
    deletedMaterials,
    selectedMaterial,
    selectedTexture
}) {
    const [isCapturing, setIsCapturing] = useState(false);
    const [showTakenShot, setShowTakenShot] = useState(null);
    const [bgColor, setBgColor] = useState('transparent');
    const [customColor, setCustomColor] = useState('#D7D8E8');

    // Helper component to manage camera zoom from state
    const ZoomManager = ({ zoom }) => {
        const { camera } = useThree();
        React.useEffect(() => {
            if (camera) {
                camera.zoom = zoom / 100;
                camera.updateProjectionMatrix();
            }
        }, [zoom, camera]);
        return null;
    };
    const [opacity, setOpacity] = useState(100);
    const [selectedFrame, setSelectedFrame] = useState('free');
    const [zoom, setZoom] = useState(100); // Default to 100%
    const [showColorPicker, setShowColorPicker] = useState(false);

    // Export panel state
    const [imageName, setImageName] = useState('');
    const [selectedResolution, setSelectedResolution] = useState('medium');
    const [exportFormat, setExportFormat] = useState('jpg');
    const [isExporting, setIsExporting] = useState(false);
    const [isSavingToGallery, setIsSavingToGallery] = useState(false);

    const canvasRef = useRef();
    const zoomWrapperRef = useRef(null);
    const glRef    = useRef(null);
    const sceneRef = useRef(null);
    const camRef   = useRef(null);

    if (!isOpen) return null;

    // Sync scroll wheel with zoom state
    React.useEffect(() => {
        const wrapper = zoomWrapperRef.current;
        if (!wrapper) return;

        const handleWheel = (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -5 : 5;
            setZoom(prev => Math.min(300, Math.max(10, prev + delta)));
        };

        wrapper.addEventListener('wheel', handleWheel, { passive: false });
        return () => wrapper.removeEventListener('wheel', handleWheel);
    }, []);

    const handleTakeShot = () => {
        setIsCapturing(true);
        setTimeout(() => {
            const gl     = glRef.current;
            const scene  = sceneRef.current;
            const camera = camRef.current;

            if (gl && scene && camera) {
                const domCanvas = gl.domElement;
                const dpr       = gl.getPixelRatio();
                const origW     = domCanvas.width  / dpr;
                const origH     = domCanvas.height / dpr;
                const ratio     = origW / origH;

                // Render at 2048px (longest side) for a crisp capture
                const CAPTURE_PX = 2048;
                const capW = ratio >= 1 ? CAPTURE_PX : Math.round(CAPTURE_PX * ratio);
                const capH = ratio >= 1 ? Math.round(CAPTURE_PX / ratio) : CAPTURE_PX;

                // Temporarily switch to 1:1 pixel ratio to avoid double-scaling
                gl.setPixelRatio(1);
                gl.setSize(capW, capH, false);
                gl.render(scene, camera);

                // ─── BACKGROUND COMPOSITING ───
                const compositeCanvas = document.createElement('canvas');
                compositeCanvas.width = capW;
                compositeCanvas.height = capH;
                const ctx = compositeCanvas.getContext('2d');

                const currentBg = bgColor === 'custom' ? customColor : bgPresets.find(p => p.id === bgColor);
                const currentOpacity = bgColor === 'custom' ? opacity / 100 : 1;

                if (bgColor === 'transparent') {
                    // Stay transparent (ctx is empty)
                } else if (bgColor === 'custom' || (currentBg && currentBg.type === 'color')) {
                    const colorValue = bgColor === 'custom' ? customColor : currentBg.value;
                    ctx.globalAlpha = currentOpacity;
                    ctx.fillStyle = colorValue;
                    ctx.fillRect(0, 0, capW, capH);
                    ctx.globalAlpha = 1.0;
                } else if (currentBg && currentBg.type === 'gradient') {
                    const grd = ctx.createLinearGradient(0, 0, capW, capH);
                    if (currentBg.id === 'gradient1') {
                        grd.addColorStop(0, '#a5b4fc');
                        grd.addColorStop(1, '#818cf8');
                    } else if (currentBg.id === 'gradient2') {
                        grd.addColorStop(0, '#60a5fa');
                        grd.addColorStop(0.5, '#f472b6');
                        grd.addColorStop(1, '#fbbf24');
                    }
                    ctx.fillStyle = grd;
                    ctx.fillRect(0, 0, capW, capH);
                }

                // 2. Draw 3D Model Layer
                ctx.drawImage(domCanvas, 0, 0);

                const dataUrl = compositeCanvas.toDataURL('image/png');

                // Restore original size
                gl.setPixelRatio(dpr);
                gl.setSize(origW, origH, false);
                gl.render(scene, camera);

                setShowTakenShot(dataUrl);
            } else {
                const canvas = document.querySelector('.camera-modal-canvas canvas');
                if (canvas) setShowTakenShot(canvas.toDataURL('image/png'));
            }
            setIsCapturing(false);
        }, 200);
    };

    // Resolution → max dimension in px
    const resolutionPxMap = { low: 720, medium: 1024, high: 2048, ultra: 4096 };

    // Format → MIME + extension
    const formatMeta = {
        png:  { mime: 'image/png',  ext: 'png'  },
        jpg:  { mime: 'image/jpeg', ext: 'jpg'  },
        webp: { mime: 'image/webp', ext: 'webp' },
        pdf:  { mime: 'image/jpeg', ext: 'pdf'  }, // Export as JPG inside PDF for better compatibility
    };

    const handleExport = () => {
        if (!showTakenShot || isExporting) return;
        setIsExporting(true);

        const targetPx  = resolutionPxMap[selectedResolution] || 1024;
        const { mime, ext } = formatMeta[exportFormat] || formatMeta.jpg;
        const name = imageName.trim() || `3d-snapshot-${Date.now()}`;

        const img = new Image();
        img.onload = () => {
            try {
                // Preserve aspect ratio — longest side = targetPx
                const ratio = img.width / img.height;
                let w, h;
                if (ratio >= 1) {
                    w = targetPx;
                    h = Math.round(targetPx / ratio);
                } else {
                    h = targetPx;
                    w = Math.round(targetPx * ratio);
                }

                const offscreen = document.createElement('canvas');
                offscreen.width  = w;
                offscreen.height = h;
                const ctx = offscreen.getContext('2d');
                
                // If exporting as JPG/PDF, fill transparent background with white
                if (ext === 'jpg' || ext === 'pdf') {
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, w, h);
                }

                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, w, h);

                const dataUrl = offscreen.toDataURL(mime, 0.95);
                
                if (exportFormat === 'pdf') {
                    const pdf = new jsPDF({
                        orientation: w > h ? 'l' : 'p',
                        unit: 'px',
                        format: [w, h]
                    });
                    pdf.addImage(dataUrl, 'JPEG', 0, 0, w, h);
                    pdf.save(`${name}.pdf`);
                } else {
                    const link = document.createElement('a');
                    link.href     = dataUrl;
                    link.download = `${name}.${ext}`;
                    link.click();
                }
            } catch (err) {
                console.error("Export failed:", err);
            } finally {
                setIsExporting(false);
            }
        };
        img.onerror = () => setIsExporting(false);
        img.src = showTakenShot;
    };

    const dataURLtoBlob = (dataurl) => {
        let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
            bstr = atob(arr[arr.length - 1]), n = bstr.length, u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
    };

    const handleAddToGallery = async () => {
        if (!showTakenShot || isSavingToGallery) return;
        
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            alert("Please login to save images to gallery.");
            return;
        }
        
        const user = JSON.parse(storedUser);
        const emailId = user.emailId;
        
        setIsSavingToGallery(true);
        
        try {
            const blob = dataURLtoBlob(showTakenShot);
            const file = new File([blob], `gallery-${Date.now()}.png`, { type: "image/png" });
            
            const formData = new FormData();
            formData.append('file', file);
            formData.append('emailId', emailId);
            formData.append('type', 'image');
            formData.append('isGallery', 'true');
            
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
            await axios.post(`${backendUrl}/api/flipbook/upload-asset`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            alert("Image added to gallery successfully!");
        } catch (err) {
            console.error("Gallery upload failed:", err);
            alert("Failed to add image to gallery. Please try again.");
        } finally {
            setIsSavingToGallery(false);
        }
    };

    const bgPresets = [
        { id: 'transparent', type: 'pattern', value: 'transparent' },
        { id: 'white', type: 'color', value: '#FFFFFF' },
        { id: 'gray', type: 'color', value: '#E5E7EB' },
        { id: 'black', type: 'color', value: '#111827' },
        { id: 'gradient1', type: 'gradient', value: 'linear-gradient(135deg, #a5b4fc 0%, #818cf8 100%)' },
        { id: 'gradient2', type: 'gradient', value: 'linear-gradient(135deg, #60a5fa 33%, #f472b6 66%, #fbbf24 100%)' },
    ];

    const frames = [
        // General
        { platform: 'General', id: 'free', label: 'Free size', w: 0, h: 0, ratio: 'Auto', icon: 'heroicons:square-3-stack-3d' },

        // Facebook
        { platform: 'Facebook', id: 'fb-profile',   label: 'Profile Photo', w: 180,  h: 180,  ratio: '1:1',   icon: 'ri:facebook-fill' },
        { platform: 'Facebook', id: 'fb-cover',     label: 'Cover Photo',   w: 820,  h: 312,  ratio: '2.6:1', icon: 'ri:facebook-fill' },
        { platform: 'Facebook', id: 'fb-post',      label: 'Post Image',    w: 1200, h: 630,  ratio: '1.9:1', icon: 'ri:facebook-fill' },
        { platform: 'Facebook', id: 'fb-story',     label: 'Story',         w: 1080, h: 1920, ratio: '9:16',  icon: 'ri:facebook-fill' },

        // Instagram
        { platform: 'Instagram', id: 'ig-profile',   label: 'Profile Photo', w: 320,  h: 320,  ratio: '1:1',   icon: 'ri:instagram-line' },
        { platform: 'Instagram', id: 'ig-square',    label: 'Square Post',   w: 1080, h: 1080, ratio: '1:1',   icon: 'ri:instagram-line' },
        { platform: 'Instagram', id: 'ig-portrait',  label: 'Portrait Post', w: 1080, h: 1350, ratio: '4:5',   icon: 'ri:instagram-line' },
        { platform: 'Instagram', id: 'ig-landscape', label: 'Landscape Post',w: 1080, h: 566,  ratio: '1.9:1', icon: 'ri:instagram-line' },
        { platform: 'Instagram', id: 'ig-story',     label: 'Story / Reel',  w: 1080, h: 1920, ratio: '9:16',  icon: 'ri:instagram-line' },

        // X (Twitter)
        { platform: 'X / Twitter', id: 'x-profile',   label: 'Profile Photo', w: 400,  h: 400,  ratio: '1:1',   icon: 'ri:twitter-x-fill' },
        { platform: 'X / Twitter', id: 'x-header',    label: 'Header / Cover',w: 1500, h: 500,  ratio: '3:1',   icon: 'ri:twitter-x-fill' },
        { platform: 'X / Twitter', id: 'x-post',      label: 'Post Image',    w: 1600, h: 900,  ratio: '16:9',  icon: 'ri:twitter-x-fill' },

        // LinkedIn
        { platform: 'LinkedIn', id: 'li-profile',   label: 'Profile Photo', w: 400,  h: 400,  ratio: '1:1',   icon: 'ri:linkedin-fill' },
        { platform: 'LinkedIn', id: 'li-cover',     label: 'Cover Photo',   w: 1584, h: 396,  ratio: '4:1',   icon: 'ri:linkedin-fill' },
        { platform: 'LinkedIn', id: 'li-post',      label: 'Post Image',    w: 1200, h: 627,  ratio: '1.9:1', icon: 'ri:linkedin-fill' },

        // YouTube
        { platform: 'YouTube', id: 'yt-profile',   label: 'Channel Profile',w: 800,  h: 800,  ratio: '1:1',   icon: 'ri:youtube-fill' },
        { platform: 'YouTube', id: 'yt-cover',     label: 'Channel Cover',  w: 2560, h: 1440, ratio: '16:9',  icon: 'ri:youtube-fill' },
        { platform: 'YouTube', id: 'yt-thumb',     label: 'Thumbnail',      w: 1280, h: 720,  ratio: '16:9',  icon: 'ri:youtube-fill' },
        { platform: 'YouTube', id: 'yt-shorts',    label: 'Shorts',         w: 1080, h: 1920, ratio: '9:16',  icon: 'ri:youtube-fill' },
    ];

    const resolutions = [
        { id: 'low',    label: 'Low',    sub: '720px' },
        { id: 'medium', label: 'Medium', sub: '1024px' },
        { id: 'high',   label: 'High',   sub: '2048px' },
        { id: 'ultra',  label: 'Ultra',  sub: '4096px' },
    ];

    const formats = ['PNG', 'JPG', 'WEBP', 'PDF'];

    const getBgStyles = () => {
        if (bgColor === 'transparent') return { backgroundColor: 'transparent' };
        if (bgColor === 'custom') {
            return { backgroundColor: customColor, opacity: opacity / 100 };
        }
        const preset = bgPresets.find(p => p.id === bgColor);
        if (preset?.type === 'gradient') {
            return { background: preset.value };
        }
        return { backgroundColor: preset?.value || '#FFFFFF' };
    };

    const getFrameStyles = () => {
        const frame = frames.find(f => f.id === selectedFrame);
        if (!frame || frame.id === 'free') return 'w-full h-full';
        
        const ratio = frame.w / frame.h;
        if (ratio >= 1.2) {
            // Very wide: fit width, center vertically
            return `w-full my-auto`;
        } else if (ratio <= 0.8) {
            // Very tall: fit height, center horizontally
            return `h-full mx-auto`;
        } else {
            // Closer to square: try height first
            return `h-full mx-auto`;
        }
    };

    // ─── Export View (after capture) ────────────────────────────────────────────
    if (showTakenShot) {
        return (
            <div className="fixed top-[8vh] left-0 right-0 bottom-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-300">
                <div className="bg-white w-[60vw] h-[85vh] rounded-[0.75vw] shadow-2xl flex flex-col relative overflow-hidden animate-in zoom-in-95 duration-300">

                    {/* Export Header */}
                    <div className="px-[1.5vw] pt-[1.5vw] pb-[1vw] flex items-start justify-between">
                        <div className="flex-1 flex flex-col">
                            <div className="flex items-center gap-[1vw] w-full">
                                <h2 className="text-[1.3vw] font-bold text-gray-800 tracking-tight whitespace-nowrap">Export 3D Snapshot</h2>
                                <div className="flex-1 h-px bg-gray-200 mt-[0.2vw]"></div>
                            </div>
                            <p className="text-[0.8vw] text-gray-400 mt-[0.2vw] font-medium leading-tight">
                                You can Save / Share the 3D Models Image in various Methods
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="ml-[1.5vw] w-[2.2vw] h-[2.2vw] flex items-center justify-center rounded-[0.5vw] border border-red-200 text-red-500 hover:bg-red-500 hover:text-white transition-all cursor-pointer shadow-sm group"
                        >
                            <Icon icon="heroicons:x-mark" width="1.3vw" className="group-hover:scale-110 transition-transform" />
                        </button>
                    </div>

                    {/* Export Body */}
                    <div className="flex flex-1 px-[1.5vw] pb-[1.5vw] gap-[1.5vw] overflow-hidden">

                        {/* Left — Image Preview */}
                        <div className="flex-[1.8] flex flex-col gap-[1vw]">
                            <div
                                className="flex-1 rounded-[0.75vw] border border-gray-200 overflow-hidden shadow-inner"
                                style={{
                                    backgroundImage: 'linear-gradient(45deg, #e5e7eb 25%, transparent 25%, transparent 75%, #e5e7eb 75%, #e5e7eb), linear-gradient(45deg, #e5e7eb 25%, transparent 25%, transparent 75%, #e5e7eb 75%, #e5e7eb)',
                                    backgroundPosition: '0 0, 10px 10px',
                                    backgroundSize: '20px 20px',
                                    backgroundColor: '#ffffff'
                                }}
                            >
                                <img
                                    src={showTakenShot}
                                    className="w-full h-full object-contain"
                                    alt="Captured Snapshot"
                                />
                            </div>

                            {/* Retake Button */}
                            <button
                                onClick={() => setShowTakenShot(null)}
                                className="flex items-center gap-[0.5vw] px-[1.2vw] py-[0.6vw] bg-[#5d5efc] hover:bg-[#4a4be0] text-white rounded-[0.7vw] font-semibold text-[0.8vw] transition-all cursor-pointer shadow-md hover:translate-y-[-2px] active:translate-y-0 w-fit"
                            >
                                <Icon icon="solar:camera-outline" width="1.1vw" />
                                Retake
                            </button>
                        </div>

                        {/* Right — Export Controls */}
                        <div className="w-[20vw] flex flex-col gap-[1.2vw] overflow-y-auto">

                            {/* Image Name */}
                            <div className="space-y-[0.7vw]">
                                <div className="flex items-center gap-[0.8vw]">
                                    <span className="text-[0.9vw] font-bold text-gray-800 whitespace-nowrap">Image Name</span>
                                    <div className="flex-1 h-[0.1vw] rounded-full bg-gray-300"></div>
                                </div>
                                <div className="flex items-center gap-[0.5vw] border border-gray-200 rounded-[0.6vw] px-[0.8vw] h-[2.6vw] bg-white focus-within:border-[#5d5efc] transition-all shadow-sm">
                                    <input
                                        type="text"
                                        value={imageName}
                                        onChange={(e) => setImageName(e.target.value)}
                                        placeholder="Name of the Image"
                                        className="flex-1 bg-transparent border-none outline-none text-[0.8vw] text-gray-600 font-medium placeholder:text-gray-400"
                                    />
                                    <button
                                        onClick={() => {}}
                                        className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                                    >
                                        <Icon icon="heroicons:pencil-square" width="1vw" />
                                    </button>
                                </div>
                            </div>

                            {/* Image Resolution */}
                            <div className="space-y-[0.7vw]">
                                <div className="flex items-center gap-[0.8vw]">
                                    <span className="text-[0.9vw] font-bold text-gray-800 whitespace-nowrap">Image resolution</span>
                                    <div className="flex-1 h-[0.1vw] rounded-full bg-gray-300"></div>
                                </div>
                                <div className="grid grid-cols-4 gap-[0.4vw]">
                                    {resolutions.map((res) => (
                                        <button
                                            key={res.id}
                                            onClick={() => setSelectedResolution(res.id)}
                                            className={`flex flex-col items-center justify-center py-[0.55vw] rounded-[0.6vw] border transition-all cursor-pointer text-center ${
                                                selectedResolution === res.id
                                                    ? 'bg-black border-black text-white shadow-md'
                                                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'
                                            }`}
                                        >
                                            <span className="text-[0.75vw] font-semibold leading-tight">{res.label}</span>
                                            <span className={`text-[0.6vw] font-medium leading-tight mt-[0.1vw] ${selectedResolution === res.id ? 'text-gray-300' : 'text-gray-400'}`}>
                                                ({res.sub})
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Export Format */}
                            <div className="space-y-[0.7vw]">
                                <div className="flex items-center gap-[0.8vw]">
                                    <span className="text-[0.9vw] font-bold text-gray-800 whitespace-nowrap">Export Image As</span>
                                    <div className="flex-1 h-[0.1vw] rounded-full bg-gray-300"></div>
                                </div>
                                <p className="text-[0.7vw] text-red-400 font-medium leading-tight">
                                    * You can Export / Share the 3D Models Image in various Methods
                                </p>
                                <div className="grid grid-cols-4 gap-[0.4vw]">
                                    {formats.map((fmt) => (
                                        <button
                                            key={fmt}
                                            onClick={() => setExportFormat(fmt.toLowerCase())}
                                            className={`py-[0.55vw] rounded-[0.6vw] border text-[0.75vw] font-semibold transition-all cursor-pointer ${
                                                exportFormat === fmt.toLowerCase()
                                                    ? 'bg-black border-black text-white shadow-md'
                                                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'
                                            }`}
                                        >
                                            {fmt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col gap-[0.6vw] pt-[3vw]">
                                <button
                                    disabled={isExporting}
                                    onClick={handleExport}
                                    className={`w-full py-[0.8vw] text-white rounded-[0.7vw] font-semibold text-[0.85vw] flex items-center justify-center gap-[0.6vw] transition-all shadow-lg active:translate-y-0 ${
                                        isExporting 
                                        ? 'bg-zinc-600 cursor-not-allowed' 
                                        : 'bg-black hover:bg-zinc-800 cursor-pointer hover:translate-y-[-2px]'
                                    }`}
                                >
                                    {isExporting ? (
                                        <>
                                            <Icon icon="line-md:loading-twotone-loop" width="1.1vw" />
                                            Exporting...
                                        </>
                                    ) : (
                                        <>
                                            <Icon icon="solar:download-outline" width="1.1vw" />
                                            Export as {exportFormat.toUpperCase()}
                                        </>
                                    )}
                                </button>
                                <button
                                    disabled={isSavingToGallery}
                                    onClick={handleAddToGallery}
                                    className={`w-full py-[0.8vw] border rounded-[0.7vw] font-semibold text-[0.85vw] flex items-center justify-center gap-[0.6vw] transition-all shadow-sm active:translate-y-0 ${
                                        isSavingToGallery
                                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                            : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-800 cursor-pointer hover:translate-y-[-2px]'
                                    }`}
                                >
                                    {isSavingToGallery ? (
                                        <>
                                            <Icon icon="line-md:loading-twotone-loop" width="1.1vw" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Icon icon="solar:gallery-outline" width="1.1vw" />
                                            Add to Image Gallery
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ─── Capture View (default) ──────────────────────────────────────────────────
    return (
        <div className="fixed top-[8vh] left-0 right-0 bottom-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-300">
            <div className="bg-white w-[60vw] h-[85vh] rounded-[0.75vw] shadow-2xl flex flex-col relative overflow-hidden animate-in zoom-in-95 duration-300">
                
                {/* Header */}
                <div className="p-[1.5vw] flex items-center justify-between">
                    <div className="flex-1 flex flex-col">
                        <div className="flex items-center gap-[1vw] w-full">
                            <h2 className="text-[1.3vw] font-bold text-gray-800 tracking-tight whitespace-nowrap">3D Snapshot</h2>
                            <div className="flex-1 h-px bg-gray-200 mt-[0.2vw]"></div>
                        </div>
                        <p className="text-[0.8vw] text-gray-400 mt-[0.2vw] font-medium leading-tight">
                            Capture high-quality images of your 3D model instantly
                        </p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="ml-[1.5vw] w-[2.2vw] h-[2.2vw] flex items-center justify-center rounded-[0.5vw] border border-red-200 text-red-500 hover:bg-red-500 hover:text-white transition-all cursor-pointer shadow-sm group"
                    >
                        <Icon icon="heroicons:x-mark" width="1.3vw" className="group-hover:scale-110 transition-transform" />
                    </button>
                </div>

                <div className="flex flex-1 px-[1.5vw] pb-[1.5vw] gap-[1.5vw] overflow-hidden">
                    {/* Left Column - Canvas */}
                    <div className="flex-[1.8] flex flex-col gap-[1vw]">
                        <div className={`relative flex-1 rounded-[0.75vw] border border-gray-300 overflow-hidden camera-modal-canvas shadow-inner ${isCapturing ? 'brightness-110' : ''}`}>
                            {/* Checkerboard Base (Seen when background is semi-transparent) */}
                            <div className="absolute inset-0" style={{
                                backgroundImage: 'linear-gradient(45deg, #f3f4f6 25%, transparent 25%, transparent 75%, #f3f4f6 75%, #f3f4f6), linear-gradient(45deg, #f3f4f6 25%, transparent 25%, transparent 75%, #f3f4f6 75%, #f3f4f6)',
                                backgroundPosition: '0 0, 10px 10px',
                                backgroundSize: '20px 20px',
                                backgroundColor: '#ffffff'
                            }} />

                            {/* Color/Gradient Overlay */}
                            <div className="absolute inset-0" style={getBgStyles()} />

                            <div className={`relative z-10 w-full h-full flex items-center justify-center p-[2vw]`}>
                                <div 
                                    className={`${getFrameStyles()} transition-all duration-700 ease-in-out bg-white/5 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.2)] relative`}
                                    style={{
                                        aspectRatio: frames.find(f => f.id === selectedFrame)?.w 
                                            ? `${frames.find(f => f.id === selectedFrame).w} / ${frames.find(f => f.id === selectedFrame).h}`
                                            : 'auto'
                                    }}
                                >
                                <div 
                                    ref={zoomWrapperRef}
                                    className="w-full h-full relative"
                                >
                                    <Suspense fallback={
                                            <div className="flex flex-col items-center justify-center h-full gap-[1vw]">
                                                <div className="w-[3vw] h-[3vw] border-[0.3vw] border-gray-200 border-t-[#5d5efc] rounded-full animate-spin"></div>
                                                <span className="text-[0.9vw] font-bold text-gray-400">Preparing Viewport...</span>
                                            </div>
                                        }>
                                            <Canvas
                                                ref={canvasRef}
                                                className="camera-modal-canvas"
                                                shadows={{ type: THREE.PCFShadowMap }}
                                                gl={{ 
                                                    preserveDrawingBuffer: true,
                                                    antialias: true,
                                                    toneMapping: THREE.ACESFilmicToneMapping,
                                                    outputColorSpace: THREE.SRGBColorSpace
                                                }}
                                                onCreated={({ gl, scene, camera }) => {
                                                    glRef.current = gl;
                                                    sceneRef.current = scene;
                                                    camRef.current = camera;
                                                    gl.shadowMap.enabled = true;
                                                    gl.shadowMap.type = THREE.PCFShadowMap;
                                                }}
                                            >
                                                <PerspectiveCamera makeDefault position={[0, 1.5, 4]} fov={45} />
                                                {(() => {
                                                    const rawX = materialSettings?.lightPosition?.x ?? 10;
                                                    const rawY = materialSettings?.lightPosition?.y ?? 10;
                                                    const rawZ = materialSettings?.lightPosition?.z ?? 10;
                                                    const sunX = Math.abs(rawX) < 0.001 && Math.abs(rawY) < 0.001 ? 0.01 : rawX;
                                                    const sunY = Math.max(1.5, rawZ);
                                                    const sunZ = -(Math.abs(rawX) < 0.001 && Math.abs(rawY) < 0.001 ? 0.01 : rawY);

                                                    return (
                                                      <>
                                                        <ambientLight intensity={0.4 + (100 - (materialSettings?.shadow ?? 50)) / 250} />
                                                        <directionalLight
                                                          position={[sunX, sunY, sunZ]}
                                                          intensity={1.8 + ((materialSettings?.specular ?? 50) / 100) * 0.8}
                                                          castShadow
                                                          shadow-bias={-0.0001}
                                                          shadow-radius={1 + ((materialSettings?.softness ?? 50) / 100) * 27}
                                                          shadow-mapSize={[2048, 2048]}
                                                          shadow-camera-left={-8}
                                                          shadow-camera-right={8}
                                                          shadow-camera-top={8}
                                                          shadow-camera-bottom={-8}
                                                          shadow-normalBias={0.02}
                                                          shadow-camera-near={0.5}
                                                          shadow-camera-far={60}
                                                        />
                                                        <directionalLight
                                                          position={[-sunX * 0.4, Math.max(sunY * 0.6, 4), -sunZ * 0.4]}
                                                          intensity={0.35}
                                                          castShadow={false}
                                                        />
                                                        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
                                                          <planeGeometry args={[120, 120]} />
                                                          <shadowMaterial transparent opacity={Math.min(1, Math.max(0, (materialSettings?.shadow ?? 50) / 100))} depthWrite={false} />
                                                        </mesh>
                                                      </>
                                                    );
                                                })()}
                                                
                                                <Center>
                                                    <group>
                                                        {models.map((model) => (
                                                            <RenderModel
                                                                key={model.id}
                                                                type={model.type}
                                                                url={model.url}
                                                                wireframe={false}
                                                                modelName={model.name}
                                                                transformMode={null} 
                                                                transformValues={transformValues}
                                                                materialSettings={materialSettings}
                                                                hiddenMaterials={new Set([...hiddenMaterials, ...deletedMaterials])}
                                                                selectedMaterial={selectedMaterial}
                                                                selectedTexture={selectedTexture}
                                                                isSelectionDisabled={true}
                                                                shouldClone={true}
                                                            />
                                                        ))}
                                                    </group>
                                                </Center>

                                                <Environment 
                                                    files={materialSettings?.maps?.envMap || null}
                                                    preset={materialSettings?.maps?.envMap ? null : 'studio'} 
                                                    environmentIntensity={(materialSettings?.reflection ?? 50) / 50}
                                                    rotation={[0, (materialSettings?.envRotation || 0) * (Math.PI / 180), 0]}
                                                />
                                                <OrbitControls makeDefault enableDamping={true} dampingFactor={0.1} enableZoom={false} target={[0, 0, 0]} />
                                                <ZoomManager zoom={zoom} />
                                            </Canvas>
                                        </Suspense>

                                        {/* Zoom Controls Overlay */}
                                        <div className="absolute bottom-[1vw] right-[1vw] bg-white/90 backdrop-blur-md rounded-[0.8vw] shadow-lg border border-gray-100 flex items-center p-[0.3vw] gap-[0.3vw] z-30">
                                            <button 
                                                onClick={() => setZoom(prev => Math.max(10, prev - 5))}
                                                className="p-[0.4vw] hover:bg-gray-100 rounded-[0.5vw] text-gray-500 transition-colors cursor-pointer"
                                            >
                                                <Icon icon="heroicons:minus" width="1vw" strokeWidth={3} />
                                            </button>
                                            <div className="flex items-center gap-[0.3vw] px-[0.4vw] border-l border-gray-100">
                                                <span className="text-[0.7vw] font-semibold text-gray-700 w-[2.2vw] text-center">{zoom}%</span>
                                            </div>
                                            <button 
                                                onClick={() => setZoom(prev => Math.min(300, prev + 5))}
                                                className="p-[0.4vw] hover:bg-gray-100 rounded-[0.5vw] text-gray-500 transition-colors cursor-pointer"
                                            >
                                                <Icon icon="heroicons:plus" width="1vw" strokeWidth={3} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Controls */}
                    <div className="flex-1 flex flex-col gap-[1.5vw] w-[20vw]">
                        
                        {/* Background Color Section */}
                        <div className="space-y-[1vw]">
                            <div className="flex items-center gap-[0.8vw]">
                                <span className="text-[0.9vw] font-bold text-gray-800 whitespace-nowrap">Background Color</span>
                                <div className="flex-1 h-[0.1vw] rounded-full bg-gray-300"></div>
                            </div>
                            
                            <div className="grid grid-cols-6 gap-[0.8vw]">
                                {bgPresets.map((preset) => (
                                    <button
                                        key={preset.id}
                                        onClick={() => setBgColor(preset.id)}
                                        className={`aspect-square rounded-[0.6vw] border-[0.15vw] transition-all cursor-pointer active:scale-95 ${
                                            bgColor === preset.id ? 'border-[#5d5efc] shadow-md ring-4 ring-[#5d5efc]/10' : 'border-gray-200 shadow-sm'
                                        }`}
                                        style={preset.id === 'transparent' ? {
                                            backgroundImage: 'linear-gradient(45deg, #e5e7eb 25%, transparent 25%, transparent 75%, #e5e7eb 75%, #e5e7eb), linear-gradient(45deg, #e5e7eb 25%, transparent 25%, transparent 75%, #e5e7eb 75%, #e5e7eb)',
                                            backgroundPosition: '0 0, 4px 4px',
                                            backgroundSize: '8px 8px',
                                            backgroundColor: '#ffffff'
                                        } : preset.type === 'gradient' ? {
                                            background: preset.value
                                        } : {
                                            backgroundColor: preset.value
                                        }}
                                    />
                                ))}
                            </div>

                            <div className="flex items-center gap-[1vw] pt-[0.2vw] relative">
                                <span 
                                    className="text-[0.85vw] text-gray-500 font-bold whitespace-nowrap cursor-pointer hover:text-gray-700"
                                    onClick={() => {
                                        setBgColor('custom');
                                        setShowColorPicker(!showColorPicker);
                                    }}
                                    onMouseDown={(e) => e.stopPropagation()}
                                >
                                    Custom :
                                </span>
                                <div className="flex-1 flex items-center gap-[0.6vw]">
                                    <div 
                                        className={`w-[2.5vw] h-[2.5vw] rounded-[0.6vw] border-2 cursor-pointer shadow-sm transition-all ${bgColor === 'custom' ? 'border-[#5d5efc] ring-4 ring-[#5d5efc]/10' : 'border-gray-200 hover:border-gray-300'}`}
                                        style={{ backgroundColor: customColor }}
                                        onClick={() => {
                                            setBgColor('custom');
                                            setShowColorPicker(!showColorPicker);
                                        }}
                                        onMouseDown={(e) => e.stopPropagation()}
                                    />
                                    <div className="flex-1 flex items-center h-[2.5vw] gap-[0.6vw] border border-gray-200 rounded-[0.6vw] px-[0.8vw] bg-gray-50/50 focus-within:bg-white focus-within:border-[#5d5efc] transition-all">
                                        <input 
                                            type="text" 
                                            value={customColor} 
                                            onChange={(e) => {
                                                setCustomColor(e.target.value);
                                                setBgColor('custom');
                                            }}
                                            className="w-full bg-transparent border-none outline-none text-[0.8vw] font-semibold text-gray-700 uppercase"
                                            placeholder="#FFFFFF"
                                        />
                                        <span className="text-[0.75vw] font-semibold text-gray-400 border-l border-gray-200 pl-[0.6vw] flex items-center h-full">{opacity}%</span>
                                    </div>
                                </div>

                                {showColorPicker && (
                                    <div className="absolute top-full right-0 mt-[1vw] z-50">
                                        <ColorPicker 
                                            color={customColor}
                                            onChange={(color) => {
                                                setCustomColor(color);
                                                setBgColor('custom');
                                            }}
                                            opacity={opacity}
                                            onOpacityChange={setOpacity}
                                            onClose={() => setShowColorPicker(false)}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Frames Section */}
                        <div className="flex-1 flex flex-col min-h-0">
                            <div className="mb-[1vw]">
                                <h3 className="text-[1vw] font-bold text-gray-800 pb-[0.5vw] border-b border-gray-200">Frames</h3>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-[0.4vw]">
                                <div className="grid grid-cols-3 gap-[0.8vw]">
                                    {frames.map((frame) => (
                                        <button
                                            key={frame.id}
                                            onClick={() => setSelectedFrame(frame.id)}
                                            className={`flex flex-col items-center gap-[0.6vw] p-[0.8vw] rounded-[0.6vw] border-[0.15vw] transition-all group cursor-pointer ${
                                                selectedFrame === frame.id 
                                                ? 'bg-white border-[#5d5efc] shadow-lg' 
                                                : 'bg-[#E5E7EB] border-transparent hover:bg-gray-300'
                                            }`}
                                        >
                                            {/* Preview Box with Dashed Border */}
                                            <div className={`w-full aspect-square bg-white rounded-[0.4vw] border-[0.1vw] border-dashed flex items-center justify-center relative ${
                                                selectedFrame === frame.id ? 'border-[#5d5efc]' : 'border-gray-400'
                                            }`}>
                                                {/* Simulated Aspect Ratio Outline */}
                                                <div 
                                                    className={`absolute border-[0.1vw] border-current opacity-20 pointer-events-none rounded-[0.1vw] ${
                                                        selectedFrame === frame.id ? 'text-[#5d5efc]' : 'text-gray-400'
                                                    }`}
                                                    style={{
                                                        width: frame.w > frame.h ? '80%' : `${(frame.w / frame.h) * 80}%`,
                                                        height: frame.h > frame.w ? '80%' : `${(frame.h / frame.w) * 80}%`,
                                                    }}
                                                />
                                                <Icon 
                                                    icon={frame.icon} 
                                                    width="1.3vw" 
                                                    className={selectedFrame === frame.id ? 'text-[#5d5efc] z-10' : 'text-gray-500 z-10'} 
                                                />
                                            </div>

                                            {/* Label Area */}
                                            <div className="flex flex-col items-center text-center">
                                                <span className={`text-[0.7vw] font-semibold leading-tight ${selectedFrame === frame.id ? 'text-[#5d5efc]' : 'text-gray-600'}`}>
                                                    {frame.label.split(' ')[0]}
                                                </span>
                                                <span className="text-[0.5vw] text-gray-400 font-medium whitespace-nowrap">
                                                    {frame.platform} [{frame.ratio}]
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <style dangerouslySetInnerHTML={{ __html: `
                                .custom-scrollbar::-webkit-scrollbar { width: 0.3vw; }
                                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                                .custom-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 1vw; }
                                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
                            `}} />
                        </div>

                        {/* Capture Button */}
                        <button 
                            onClick={handleTakeShot}
                            disabled={isCapturing}
                            className="w-full py-[0.75vw] cursor-pointer bg-black text-white rounded-[0.8vw] flex items-center justify-center gap-[1vw] shadow-[0_1.5vw_3vw_-1vw_rgba(0,0,0,0.3)] hover:bg-zinc-800 hover:translate-y-[-2px] active:translate-y-0 active:scale-[0.98] transition-all group disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0"
                        >
                            <div className="w-[2.6vw] h-[2.6vw] rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-all border border-white/5 shadow-inner">
                                <Icon icon="solar:camera-outline" width="1.4vw" />
                            </div>
                            <span className="text-[0.9vw] font-semibold tracking-tight">Capture Image for Export</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
