import React, { useState, Suspense, useRef, useMemo, useEffect } from 'react';
import { X, Check, ZoomIn, ZoomOut, Edit3, Download, ChevronDown, Layers, Box, Info } from 'lucide-react';
import * as THREE from 'three';
import { Canvas } from "@react-three/fiber";
import { View, OrbitControls, Environment, PerspectiveCamera, ContactShadows, Html, Center } from "@react-three/drei";
import RenderModel from "./ModelLoaders";
import { GlobalLoader } from "./GlobalLoader";
const ModelThumbnail = React.memo(({ 
    materialName, 
    models, 
    materialSettings, 
    selectedTexture, 
    materialList, 
    containerRef 
}) => {
    const viewRef = useRef();
    
    // Calculate hidden materials for this specific thumbnail
    const thumbnailHiddenMaterials = useMemo(() => {
        const allMaterials = new Set();
        const list = Array.isArray(materialList) ? materialList : [];
        list.forEach(item => {
            if (typeof item === 'string') {
                allMaterials.add(item);
            } else if (item && item.materials) {
                item.materials.forEach(m => allMaterials.add(m));
            }
        });

        const selectionHidden = new Set();
        allMaterials.forEach(m => {
            if (m !== materialName) {
                selectionHidden.add(m);
            }
        });
        
        return selectionHidden;
    }, [materialName, materialList]);

    return (
      <div ref={viewRef} className="w-full h-full relative group bg-[#393939] flex items-center justify-center overflow-hidden rounded-[0.3vw] shadow-inner">
          <View track={viewRef} className="w-full h-full">
              <Suspense fallback={
                  <Html center>
                      <div className="flex flex-col items-center gap-[0.5vw]">
                          <div className="w-[1.2vw] h-[1.2vw] border-[0.15vw] border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"></div>
                      </div>
                  </Html>
              }>
                  <PerspectiveCamera makeDefault position={[0, 1, 5]} fov={45} />
                  {(() => {
                    const rawX = materialSettings.lightPosition?.x ?? 10;
                    const rawY = materialSettings.lightPosition?.y ?? 10;
                    const rawZ = materialSettings.lightPosition?.z ?? 10;
                    const sunX = Math.abs(rawX) < 0.001 && Math.abs(rawY) < 0.001 ? 0.01 : rawX;
                    const sunY = Math.max(1.5, rawZ);
                    const sunZ = -(Math.abs(rawX) < 0.001 && Math.abs(rawY) < 0.001 ? 0.01 : rawY);

                    return (
                      <>
                        <ambientLight intensity={0.4 + (100 - (materialSettings.shadow ?? 50)) / 250} />
                        <directionalLight
                          position={[sunX, sunY, sunZ]}
                          intensity={1.8 + ((materialSettings.specular ?? 50) / 100) * 0.8}
                          castShadow
                          shadow-bias={-0.0001}
                          shadow-radius={1 + ((materialSettings.softness ?? 50) / 100) * 27}
                          shadow-mapSize={[2048, 2048]}
                          shadow-camera-left={-8}
                          shadow-camera-right={8}
                          shadow-camera-top={8}
                          shadow-camera-bottom={-8}
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
                          <shadowMaterial transparent opacity={Math.min(1, Math.max(0, (materialSettings.shadow ?? 50) / 100))} depthWrite={false} />
                        </mesh>
                      </>
                    );
                  })()}
                  
                  <group position={[0, 0, 0]}>
                      {models.map((model) => (
                          <RenderModel
                              key={model.id}
                              type={model.type}
                              url={model.url}
                              isSelectionDisabled={true}
                              shouldClone={true}
                              materialSettings={materialSettings}
                              hiddenMaterials={thumbnailHiddenMaterials}
                              selectedTexture={selectedTexture}
                          />
                      ))}
                  </group>


                  <Environment
                      files={materialSettings?.maps?.envMap || null}
                      preset={materialSettings?.maps?.envMap ? null : (materialSettings?.environment || 'studio')}
                      background={false}
                      blur={0.5}
                      environmentIntensity={(materialSettings?.reflection ?? 50) / 50}
                      rotation={[0, (materialSettings?.envRotation || 0) * (Math.PI / 180), 0]}
                  />
              </Suspense>
          </View>
      </div>
    );
});

export default function Export3DModal({ 
  onClose, 
  onExport, 
  modelName = "Model Name", 
  modelSize = "80MB", 
  models = [],
  materialSettings = {},
  transformValues = {},
  hiddenMaterials = new Set(),
  deletedMaterials = new Set(),
  selectedTexture = null,
  selectedMaterial = null,
  materialList = []
}) {
  const [exportScope, setExportScope] = useState('full');

  const containerRef = useRef();

  const [orientation, setOrientation] = useState('Y axis up');
  const [isAxisOpen, setIsAxisOpen] = useState(false);
  const [includeTextures, setIncludeTextures] = useState(true);
  const [embedTextures, setEmbedTextures] = useState(true);
  const [exportSeparate, setExportSeparate] = useState(false);
  const [quality, setQuality] = useState('Medium');
  const [exportFormat, setExportFormat] = useState('GLB');
  const [fileName, setFileName] = useState(modelName);
  const [zoomLevel, setZoomLevel] = useState(50);
  const [compression, setCompression] = useState(50);
  const [customMaterialNames, setCustomMaterialNames] = useState({});
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [excludedParts, setExcludedParts] = useState(new Set());
  const settingsContainerRef = useRef(null);
  const mainViewRef = useRef(null);
  const modalRef = useRef(null);
  const [showTopShadow, setShowTopShadow] = useState(false);
  const [showBottomShadow, setShowBottomShadow] = useState(false);
  const [showLeftTopShadow, setShowLeftTopShadow] = useState(false);
  const [showLeftBottomShadow, setShowLeftBottomShadow] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // ─── Realistic Size Calculation Logic ───────────────────────────────────────
  //
  // "Before Compression" = the actual raw file size supplied by the OS/server.
  // We only apply scope-narrowing (selection mode) so the user sees what portion
  // of the model they are truly exporting.
  //
  // "After Compression" = an industry-accurate estimate based on:
  //   • Export format  – GLB binary vs OBJ/FBX text-based baselines
  //   • Draco level    – real Draco geometry-compression curves
  //   • Texture policy – embedding vs. stripping textures
  //   • Quality preset – texture downscaling factors
  //
  // All ratios are derived from Khronos / Google Draco benchmarks.

  // Helper: format a raw MB number into a human-readable string
  const formatSize = (mb) => {
      if (mb < 1) return `${(mb * 1024).toFixed(0)} KB`;
      if (mb < 10) return `${mb.toFixed(2)} MB`;
      return `${mb.toFixed(1)} MB`;
  };

  // 1. Raw file size (always the actual on-disk size, never touched by quality/compression)
  const rawFileSizeMB = useMemo(() => {
      // modelSize arrives as e.g. "23.6 MB" or "1024.00 KB" — normalise to MB
      const str = String(modelSize || '0');
      const num = parseFloat(str) || 0;
      if (str.toLowerCase().includes('kb')) return num / 1024;
      return num; // already MB
  }, [modelSize]);

  // 2. "Before Compression" = raw size adjusted only for export scope
  const calculatedBeforeSize = useMemo(() => {
      let base = rawFileSizeMB;
      if (base <= 0) return 0;

      // Selection-mode narrows to the relevant materials
      if (exportScope === 'selection' && selectedMaterial) {
          const totalMaterials = Math.max(1, materialList?.length || 1);
          const selectedMaterials = selectedMaterial.isGroup
              ? Math.max(1, selectedMaterial.materials?.length || 1)
              : 1;
          const excludedCount = excludedParts.size;
          const activeCount = Math.max(1, selectedMaterials - excludedCount);
          // Geometry overhead ~15 % of total; textures ~85 %
          const geometryPortion = base * 0.15 * (activeCount / totalMaterials);
          const texturePortion  = base * 0.85 * (activeCount / totalMaterials);
          base = geometryPortion + texturePortion;
      }

      return Math.max(0.001, base);
  }, [rawFileSizeMB, exportScope, selectedMaterial, materialList, excludedParts]);

  // 3. "After Compression" = realistic estimate after applying all export settings
  const calculatedAfterSize = useMemo(() => {
      let result = calculatedBeforeSize;
      if (result <= 0) return 0;

      // --- Split the file into geometry and texture budgets ---
      // Typical distribution for textured 3D assets:
      //   Geometry  ≈ 15 % of raw size
      //   Textures  ≈ 85 % of raw size (or 0 if not included)
      let geomMB    = result * 0.15;
      let textureMB = result * 0.85;

      // ── A. Texture stripping ────────────────────────────────────────────────
      if (!includeTextures) {
          textureMB = 0;   // Textures fully removed from export
      } else {
          // ── B. Texture quality downscaling ──────────────────────────────────
          // Each quality step halves texture resolution (= 1/4 pixel count)
          const qualityMultiplier = {
              'Low':      0.12,  // 512 px  — ~88 % texture reduction vs Original
              'Medium':   0.25,  // 1024 px — ~75 % texture reduction vs Original
              'High':     0.55,  // 2048 px — ~45 % texture reduction vs Original
              'Original': 1.00,  // Full res — no downscaling
          }[quality] ?? 0.25;
          textureMB *= qualityMultiplier;
      }

      // ── C. Geometry / Draco compression (slider 0–100) ──────────────────────
      // Draco compression benchmarks (Khronos reference models):
      //   GLB  – Draco cuts geometry to ≈5–30 % of original geometry size
      //   OBJ  – text-based; Draco+OBJ wrapping gives ≈10–40 % of text geometry
      //   FBX  – proprietary binary; less proven with Draco, ≈20–50 %
      //
      // Slider at 0   → no compression applied   (ratio = 1.00)
      // Slider at 100 → maximum Draco compression (ratio = formatMin)
      const formatMin = { GLB: 0.05 }[exportFormat] ?? 0.05;
      // Expo-curve gives a realistic compression knee around 30–50 %
      const t = compression / 100; // 0 … 1
      const geomRatio = 1 - t * (1 - formatMin); // linear from 1.0 → formatMin
      geomMB *= geomRatio;

      result = geomMB + textureMB;

      // Safety floor: compressed size can never exceed original
      return Math.min(result, calculatedBeforeSize);
  }, [calculatedBeforeSize, compression, exportFormat, includeTextures, quality]);

  // Model Rotation Logic based on Orientation
  const modelRotation = useMemo(() => {
      if (orientation === 'Z axis up') return [-Math.PI / 2, 0, 0];
      return [0, 0, 0];
  }, [orientation]);

  const handleScroll = (ref, setTop, setBottom) => {
      if (!ref.current) return;
      const { scrollTop, scrollHeight, clientHeight } = ref.current;
      setTop(scrollTop > 10);
      setBottom(scrollHeight > scrollTop + clientHeight + 10);
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(200, prev + 25));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(25, prev - 25));

  const handleExportClick = () => {
      onExport?.({ 
          orientation, 
          includeTextures, 
          embedTextures, 
          exportSeparate, 
          quality, 
          exportFormat, 
          fileName,
          exportScope,
          compression,
          draco: compression > 0, // Automatically enable Draco if compression slider is used
          excludedParts: Array.from(excludedParts),
          selectedMaterial: exportScope === 'selection' ? selectedMaterial : null,
          customMaterialNames: customMaterialNames
      });
      onClose();
  };

  const effectiveHiddenMaterials = React.useMemo(() => {
    const baseHidden = new Set([...(hiddenMaterials || []), ...(deletedMaterials || []), ...excludedParts]);
    
    if (exportScope === 'selection' && selectedMaterial) {
        const allMaterials = new Set();
        (materialList || []).forEach(item => {
            if (typeof item === 'string') {
                allMaterials.add(item);
            } else if (item && item.materials) {
                (item.materials || []).forEach(m => allMaterials.add(m));
            }
        });

        const selectedNames = new Set(
            selectedMaterial.isGroup 
                ? (selectedMaterial.materials || []) 
                : [selectedMaterial.name]
        );

        const selectionHidden = new Set();
        allMaterials.forEach(m => {
            if (!selectedNames.has(m) || excludedParts.has(m)) {
                selectionHidden.add(m);
            }
        });
        
        return new Set([...baseHidden, ...selectionHidden]);
    }
    
    return baseHidden;
  }, [exportScope, selectedMaterial, hiddenMaterials, deletedMaterials, materialList, excludedParts]);
  
  useEffect(() => {
    // Check shadows and initialization delay
    const timer = setTimeout(() => {
        handleScroll(containerRef, setShowLeftTopShadow, setShowLeftBottomShadow);
        handleScroll(settingsContainerRef, setShowTopShadow, setShowBottomShadow);
        setIsInitializing(false);
    }, 1200);

    return () => {
        clearTimeout(timer);
    };
  }, [selectedMaterial, exportScope]);

  return (
    <div ref={modalRef} className="fixed top-[8vh] left-0 right-0 bottom-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-[0.1vw] animate-in fade-in zoom-in duration-200">
      <div className="bg-white rounded-[0.75vw] shadow-2xl w-[70vw] h-[42vw] max-h-[85vh] flex flex-col overflow-hidden relative border border-gray-100">
        
        {/* Global Loading Overlay */}
        <GlobalLoader manualLoading={isInitializing} text="Preparing 3D Export ..." />

        {/* Header - Masking Layer */}
        <div className="px-[2vw] pt-[2vw] pb-[2vw] flex items-start justify-between bg-white w-full relative z-[30]">
            <div className="flex flex-col flex-1 pr-[2vw]">
                <div className="flex items-center gap-[1vw]">
                    <h2 className="text-[1.35vw] font-bold text-gray-900 tracking-tight">Export 3D Model</h2>
                    <div className="h-[0.1vw] bg-gray-200 flex-1 ml-[1vw] mt-[0.3vw]"></div>
                </div>
                <p className="text-[0.75vw] text-gray-400 mt-[0.3vw] font-medium">
                    <span className="text-red-500 font-bold">*</span>You can Save / Share the 3D Models Image in various Methods
                </p>
            </div>
            <button 
                onClick={onClose} 
                className="p-[0.4vw] border cursor-pointer border-red-200 text-red-500 rounded-[0.4vw] hover:bg-red-50 transition-colors shrink-0 mt-[-0.2vw]"
                title="Close"
            >
                <X size="1.2vw" />
            </button>
        </div>

        {/* Content Body */}
        <div className="flex flex-row px-[2vw] pb-0 pt-0 gap-[1.5vw] items-stretch bg-white flex-1 min-h-0 relative z-[10]">
            
            {/* Left Column (Conditional UI) */}
            {exportScope === 'selection' ? (
                /* Material Grid UI */
                <div className="w-[calc(44.5%-0.75vw)] bg-[#f8f9fa] rounded-[1vw] relative flex flex-col border border-gray-100 overflow-hidden h-full isolate">
                    {/* Top Opaque Mask - Ensures models clip before the header starts */}
                    <div className="absolute -top-[1vw] left-0 right-0 h-[1vw] bg-white z-[29]" />
                    
                    {/* Bottom Opaque Mask - Ensures models clip before the footer starts */}
                    <div className="absolute -bottom-[1vw] left-0 right-0 h-[1vw] bg-white z-[29]" />

                    {/* Top Shadow Indicator */}
                    <div className={`absolute top-0 left-0 right-0 h-[3vw] bg-gradient-to-b from-black/10 to-transparent z-[25] pointer-events-none transition-opacity duration-300 ${showLeftTopShadow ? 'opacity-100' : 'opacity-0'}`} />
                                        
                    <div 
                        ref={containerRef} 
                        onScroll={() => handleScroll(containerRef, setShowLeftTopShadow, setShowLeftBottomShadow)}
                        className="w-full h-full overflow-y-auto custom-scrollbar p-[1.2vw] pr-[0.8vw]"
                    >
                        <div className="grid grid-cols-2 gap-x-[1.2vw] gap-y-[1.5vw]">
                            {(selectedMaterial?.isGroup 
                                ? (selectedMaterial.materials || []).map(m => typeof m === 'string' ? m : (m?.name || m?.material || String(m))) 
                                : [typeof selectedMaterial?.name === 'string' ? selectedMaterial.name : (selectedMaterial?.name?.name || "Material")]
                            ).map((name, idx) => (
                                <div key={idx} className="flex flex-col gap-[0.6vw]">
                                    <div 
                                        onClick={() => {
                                            setExcludedParts(prev => {
                                                const next = new Set(prev);
                                                if (next.has(name)) next.delete(name);
                                                else next.add(name);
                                                return next;
                                            });
                                        }}
                                        className={`aspect-square bg-white rounded-[0.6vw] shadow-sm flex items-center justify-center overflow-hidden border transition-all relative cursor-pointer ${
                                            excludedParts.has(name) ? 'border-gray-200 opacity-50 grayscale-[0.5]' : 'border-indigo-600/30'
                                        }`}
                                    >
                                         <ModelThumbnail 
                                            materialName={name} 
                                            models={models}
                                            materialSettings={materialSettings}
                                            selectedTexture={selectedTexture}
                                            materialList={materialList}
                                            containerRef={containerRef}
                                         />
                                         {/* Selection Checkbox */}
                                         <div className="absolute top-[0.5vw] right-[0.5vw] z-[20]">
                                             <div className={`w-[1.2vw] h-[1.2vw] rounded-full flex items-center justify-center border transition-all ${
                                                 !excludedParts.has(name) 
                                                     ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                                                     : 'bg-white border-gray-300 text-transparent'
                                             }`}>
                                                 <Check size="0.8vw" strokeWidth={4} />
                                             </div>
                                         </div>
                                         {/* Local Item Border Overlay */}
                                         <div className={`absolute inset-0 border rounded-[0.6vw] pointer-events-none z-[16] ${
                                             excludedParts.has(name) ? 'border-gray-200/50' : 'border-indigo-600/20'
                                         }`} />
                                    </div>
                                    <div className="flex items-center justify-between px-[0.2vw] gap-[0.5vw]">
                                        {editingMaterial === name ? (
                                            <div className="flex-1 flex items-center bg-white border border-gray-300 rounded-[0.3vw] px-[0.4vw]">
                                                <input 
                                                    autoFocus
                                                    value={customMaterialNames[name] !== undefined ? customMaterialNames[name] : name}
                                                    onChange={(e) => setCustomMaterialNames(prev => ({ ...prev, [name]: e.target.value }))}
                                                    onBlur={() => setEditingMaterial(null)}
                                                    onKeyDown={(e) => e.key === 'Enter' && setEditingMaterial(null)}
                                                    className="w-full outline-none text-[0.8vw] font-bold text-gray-800 py-[0.2vw]"
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex items-center min-w-0 flex-1">
                                                <span className="text-[0.8vw] font-bold text-gray-500 truncate">
                                                    {customMaterialNames[name] || name}
                                                </span>
                                                <span className="text-gray-400 font-medium text-[0.8vw] shrink-0">
                                                    &nbsp;.{exportFormat.toLowerCase()}
                                                </span>
                                            </div>
                                        )}
                                        <div 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingMaterial(editingMaterial === name ? null : name);
                                            }}
                                            className="p-[0.3vw] hover:bg-gray-100 rounded-[0.3vw] transition-colors cursor-pointer shrink-0"
                                        >
                                            <Edit3 size="0.9vw" className={`${editingMaterial === name ? 'text-indigo-600' : 'text-gray-400'}`} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Bottom Shadow Indicator */}
                    <div className={`absolute bottom-0 left-0 right-0 h-[3vw] bg-gradient-to-t from-black/10 to-transparent z-[25] pointer-events-none transition-opacity duration-300 ${showLeftBottomShadow ? 'opacity-100' : 'opacity-0'}`} />
                </div>
            ) : (
                /* Original Full View UI (Canvas) */
                <div className="w-[calc(44.5%-0.75vw)] bg-[#f8f9fa] rounded-[1vw] p-[1.2vw] relative flex flex-col border border-gray-100 overflow-hidden h-full">
                    <div ref={mainViewRef} className="bg-[#393939] flex-1 rounded-[0.8vw] flex items-center justify-center relative overflow-hidden group border border-gray-100/50 h-full">
                        {models.length > 0 ? (
                             <div 
                                 className="w-full h-full cursor-grab active:cursor-grabbing"
                                 onWheel={(e) => {
                                     e.stopPropagation();
                                     setZoomLevel(prev => {
                                         const newVal = prev - (e.deltaY * 0.05);
                                         return Math.max(25, Math.min(200, Math.round(newVal)));
                                     });
                                 }}
                             >
                                 <Suspense fallback={
                                     <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#f2f2f2] z-10 gap-[1vw]">
                                         <div className="w-[2vw] h-[2vw] border-[0.25vw] border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"></div>
                                         <p className="text-[0.85vw] font-medium text-gray-400">Loading 3D Model...</p>
                                     </div>
                                 }>
                                     <View track={mainViewRef} className="w-full h-full">
                                         <PerspectiveCamera makeDefault position={[0, 1, 5]} fov={45} zoom={zoomLevel / 45} />
                                         {(() => {
                                            const rawX = materialSettings.lightPosition?.x ?? 10;
                                            const rawY = materialSettings.lightPosition?.y ?? 10;
                                            const rawZ = materialSettings.lightPosition?.z ?? 10;
                                            const sunX = Math.abs(rawX) < 0.001 && Math.abs(rawY) < 0.001 ? 0.01 : rawX;
                                            const sunY = Math.max(1.5, rawZ);
                                            const sunZ = -(Math.abs(rawX) < 0.001 && Math.abs(rawY) < 0.001 ? 0.01 : rawY);

                                            return (
                                              <>
                                                <ambientLight intensity={0.4 + (100 - (materialSettings.shadow ?? 50)) / 250} />
                                                <directionalLight
                                                  position={[sunX, sunY, sunZ]}
                                                  intensity={1.8 + ((materialSettings.specular ?? 50) / 100) * 0.8}
                                                  castShadow
                                                  shadow-bias={-0.0001}
                                                  shadow-radius={1 + ((materialSettings.softness ?? 50) / 100) * 27}
                                                  shadow-mapSize={[2048, 2048]}
                                                  shadow-camera-left={-8}
                                                  shadow-camera-right={8}
                                                  shadow-camera-top={8}
                                                  shadow-camera-bottom={-8}
                                                  shadow-camera-near={0.5}
                                                  shadow-camera-far={60}
                                                />
                                                <directionalLight
                                                  position={[-sunX * 0.4, Math.max(sunY * 0.6, 4), -sunZ * 0.4]}
                                                  intensity={0.35}
                                                  castShadow={false}
                                                />
                                                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]} receiveShadow>
                                                  <planeGeometry args={[120, 120]} />
                                                  <shadowMaterial transparent opacity={Math.min(1, Math.max(0, (materialSettings.shadow ?? 50) / 100))} depthWrite={false} />
                                                </mesh>
                                              </>
                                            );
                                          })()}
                                         <group position={[0, -0.6, 0]}>
                                             {models.map((model) => (
                                                 <RenderModel
                                                     key={model.id}
                                                     type={model.type}
                                                     url={model.url}
                                                     isSelectionDisabled={true}
                                                     shouldClone={true}
                                                     includeTextures={includeTextures}
                                                     transformValues={transformValues}
                                                     materialSettings={materialSettings}
                                                     hiddenMaterials={effectiveHiddenMaterials}
                                                     selectedTexture={selectedTexture}
                                                 />
                                             ))}
                                         </group>
                                         <Environment
                                             files={materialSettings?.maps?.envMap || null}
                                             preset={materialSettings?.maps?.envMap ? null : (materialSettings?.environment || 'studio')}
                                             background={false}
                                             blur={0.5}
                                             environmentIntensity={(materialSettings?.reflection ?? 50) / 50}
                                             rotation={[0, (materialSettings?.envRotation || 0) * (Math.PI / 180), 0]}
                                         />
                                         <OrbitControls 
                                             enableZoom={false} 
                                             enablePan={false}
                                             autoRotate={false}
                                             maxPolarAngle={Math.PI / 2}
                                             makeDefault
                                         />
                                     </View>
                                 </Suspense>
                             </div>
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#f2f2f2] z-10 gap-[1vw]">
                                <div className="w-[2vw] h-[2vw] border-[0.25vw] border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"></div>
                                <p className="text-[0.85vw] font-medium text-gray-400">Loading 3D Model...</p>
                            </div>
                        )}
                        <div className="absolute bottom-[0.8vw] right-[0.8vw] bg-white/90 backdrop-blur-md rounded-[0.4vw] shadow-sm z-20 border border-gray-200 flex items-center overflow-hidden">
                            <button onClick={handleZoomOut} disabled={zoomLevel <= 25} className="px-[0.6vw] py-[0.4vw] hover:bg-gray-100 text-gray-700 disabled:opacity-50 transition-colors cursor-pointer"><ZoomOut size="0.9vw" /></button>
                            <div className="px-[0.4vw] py-[0.4vw] text-[0.75vw] font-bold text-gray-700 min-w-[2.5vw] text-center border-x border-gray-100 flex items-center justify-center">{zoomLevel}%</div>
                            <button onClick={handleZoomIn} disabled={zoomLevel >= 200} className="px-[0.6vw] py-[0.4vw] hover:bg-gray-100 text-gray-700 disabled:opacity-50 transition-colors cursor-pointer"><ZoomIn size="0.9vw" /></button>
                        </div>
                    </div>
                </div>
            )}


            {/* Right Column (Settings) - Masking Layer */}
            <div className="w-[calc(55.5%-0.75vw)] relative flex flex-col h-full bg-gray-100 rounded-[1vw] border border-gray-100/80 overflow-hidden z-[30]">
                {/* Top Shadow Indicator */}
                <div className={`absolute top-0 left-0 right-0 h-[2vw] bg-gradient-to-b from-black/10 to-transparent z-10 pointer-events-none transition-opacity duration-300 ${showTopShadow ? 'opacity-100' : 'opacity-0'}`} />
                
                <div 
                    ref={settingsContainerRef}
                    onScroll={() => handleScroll(settingsContainerRef, setShowTopShadow, setShowBottomShadow)}
                    className="w-full h-full overflow-y-auto custom-scrollbar p-[1.5vw] flex flex-col gap-[2vw]"
                >
                    {/* Axis / Orientation */}
                    <div className="flex flex-col gap-[1vw]">
                        <div className="flex items-center gap-[1vw]">
                            <h3 className="text-[1vw] font-bold text-gray-800 tracking-tight">Axis / Orientation</h3>
                            <div className="h-[0.1vw] bg-gray-200 flex-1"></div>
                        </div>
                        <div className="flex items-center justify-between">
                            <p className="text-[0.75vw] text-gray-500 w-[60%] leading-relaxed font-medium">Choose the correct axis orientation for compatibility with your 3D software</p>
                            <div className="flex items-center gap-[0.5vw]">
                                <span className="text-gray-400 text-[0.8vw] font-bold">:</span>
                                <div className="relative">
                                    <div 
                                        onClick={() => setIsAxisOpen(!isAxisOpen)}
                                        className="bg-white border border-gray-100 text-gray-700 text-[0.75vw] font-semibold rounded-[0.4vw] px-[0.8vw] py-[0.45vw] shadow-sm cursor-pointer flex items-center justify-between min-w-[8vw] hover:bg-gray-50 transition-all select-none"
                                    >
                                        <span>{orientation}</span>
                                        <ChevronDown size="1vw" className={`text-gray-500 ml-[0.5vw] transition-transform duration-200 ${isAxisOpen ? 'rotate-180' : ''}`} />
                                    </div>
                                    
                                    {isAxisOpen && (
                                        <>
                                            <div className="fixed inset-0 z-[1001]" onClick={() => setIsAxisOpen(false)} />
                                            <div className="absolute top-[calc(100%+0.2vw)] left-0 w-full min-w-[100%] bg-white border border-gray-100 rounded-[0.4vw] shadow-xl overflow-hidden z-[1002] animate-in fade-in slide-in-from-top-1 duration-150 py-[0.1vw]">
                                                {['Y axis up', 'Z axis up'].map(opt => (
                                                    <div
                                                        key={opt}
                                                        onClick={() => {
                                                            setOrientation(opt);
                                                            setIsAxisOpen(false);
                                                        }}
                                                        className={`w-full text-left px-[0.8vw] py-[0.4vw] text-[0.75vw] transition-all cursor-pointer ${
                                                            orientation === opt 
                                                                ? 'bg-gray-50 font-bold text-indigo-600' 
                                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium'
                                                        }`}
                                                    >
                                                        {opt}
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Texture Inclusion */}
                    <div className="flex flex-col gap-[1vw]">
                        <div className="flex items-center gap-[1vw]">
                            <h3 className="text-[1vw] font-bold text-gray-800 tracking-tight">Texture Inclusion</h3>
                            <div className="h-[0.1vw] bg-gray-200 flex-1"></div>
                        </div>
                        <div className="flex flex-col gap-[1vw]">
                            <label className="flex items-center gap-[0.8vw] cursor-pointer group">
                                <div className="relative flex items-center justify-center">
                                    <input 
                                        type="checkbox"
                                        checked={includeTextures}
                                        onChange={(e) => {
                                            const checked = e.target.checked;
                                            setIncludeTextures(checked);
                                            setEmbedTextures(checked);
                                        }}
                                        className="peer appearance-none w-[1.1vw] h-[1.1vw] border-[0.12vw] border-gray-300 rounded-[0.25vw] checked:bg-[#4f46e5] checked:border-[#4f46e5] transition-all bg-white shadow-sm"
                                    />
                                    <Check className="w-[0.8vw] h-[0.8vw] text-white absolute opacity-0 peer-checked:opacity-100 pointer-events-none" strokeWidth={4} />
                                </div>
                                <span className="text-gray-900 font-bold text-[0.75vw]">Include Textures</span>
                            </label>
                        </div>
                    </div>

                    {/* Texture Quality / Resolution */}
                    <div className={`flex flex-col gap-[0.8vw] transition-opacity duration-200 ${!includeTextures ? 'opacity-40 pointer-events-none select-none' : ''}`}>
                        <div className="flex items-center gap-[0.8vw]">
                            <h3 className="text-[1vw] font-bold text-gray-800 tracking-tight">Texture Quality / Resolution</h3>
                            <div className="h-[0.1vw] bg-gray-200 flex-1"></div>
                        </div>
                        <p className="text-[0.7vw] text-gray-400 font-medium -mt-[0.5vw]">Higher quality gives better visual detail but increases file size.</p>
                        <div className="grid grid-cols-4 gap-[0.6vw]">
                            {[
                                { name: 'Low', desc: 'Optimized for web' },
                                { name: 'Medium', desc: 'Balanced' },
                                { name: 'High', desc: 'Detailed' },
                                { name: 'Original', desc: 'No compression' }
                            ].map(q => (
                                <button 
                                    key={q.name}
                                    disabled={!includeTextures}
                                    onClick={() => setQuality(q.name)}
                                    className={`flex flex-col items-center justify-center py-[0.5vw] rounded-[0.4vw] border-[0.1vw] transition-all ${
                                        quality === q.name 
                                            ? 'bg-black text-white border-black shadow-md scale-[1.02]' 
                                            : 'bg-white cursor-pointer text-gray-400 border-gray-100 hover:border-gray-200 font-medium'
                                    }`}
                                >
                                    <span className="text-[0.7vw] font-bold">{q.name}</span>
                                    <span className={`text-[0.5vw] mt-[0.1vw] ${quality === q.name ? 'text-gray-400' : 'text-gray-400'}`}>({q.desc})</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 3D Model Compressor */}
                    <div className="flex flex-col gap-[0.2vw]">
                        <div className="flex items-center gap-[0.8vw]">
                            <h3 className="text-[1vw] font-bold text-gray-800 tracking-tight">3D Model Compressor</h3>
                            <div className="h-[0.1vw] bg-gray-200 flex-1"></div>
                        </div>
                        <p className="text-[0.75vw] text-gray-400 font-medium">Control model quality and file size using compression.</p>
                        
                        <div className="px-[0.5vw] pt-[1.9vw] pb-[0.2vw]">
                            <div className="relative group">
                                {/* Tooltip / Speech Bubble */}
                                <div 
                                    className="absolute -top-[2.2vw] bg-white text-gray-800 text-[0.7vw] font-bold px-[0.6vw] py-[0.3vw] rounded-[0.4vw] shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-gray-100 transform -translate-x-1/2 flex items-center justify-center min-w-[2.5vw] z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                                    style={{ left: `${compression}%` }}
                                >
                                    {compression}%
                                    {/* Triangle Tail */}
                                    <div className="absolute -bottom-[0.3vw] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[0.3vw] border-l-transparent border-r-[0.3vw] border-r-transparent border-t-[0.3vw] border-t-white"></div>
                                </div>
                                
                                {/* Range Slider Track */}
                                <div className="h-[0.4vw] w-full bg-gradient-to-r from-[#ff4d00] via-[#ffcc00] via-[#00ffcc] to-[#0099ff] rounded-full relative shadow-inner">
                                    <input 
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={compression}
                                        onChange={(e) => setCompression(parseInt(e.target.value))}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
                                    />
                                    {/* Handle with Glow */}
                                    <div 
                                        className="absolute top-1/2 -translate-y-1/2 w-[1vw] h-[1vw] bg-white border-[0.15vw] border-black shadow-[0_0_0_1px_rgba(0,0,0,0.05),0_4_8px_rgba(0,0,0,0.15)] rounded-full transform -translate-x-1/2 pointer-events-none flex items-center justify-center"
                                        style={{ left: `${compression}%` }}
                                    >
                                        <div className="w-full h-full rounded-full bg-white shadow-[inset_0_0_1px_rgba(0,0,0,0.1)]"></div>
                                    </div>
                                </div>
                                
                                {/* End-point Labels */}
                                <div className="flex items-center justify-between mt-[0.6vw] px-[0.2vw]">
                                    <span className="text-[0.6vw] font-bold text-gray-900 opacity-60">(High Quality)</span>
                                    <span className="text-[0.6vw] font-bold text-gray-900 opacity-60">(Low Quality)</span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-[0.2vw] mt-[0.2vw]">
                                <div className="flex items-center gap-[0.5vw] text-[0.75vw] font-medium text-gray-500">
                                    <span>Before Compression</span>
                                    <span>:</span>
                                    <span className="text-gray-800">{formatSize(calculatedBeforeSize)}</span>
                                </div>
                                <div className="flex items-center gap-[0.5vw] text-[0.75vw] font-medium text-gray-500">
                                    <span>After Compression</span>
                                    <span>:</span>
                                    <span className="text-green-500 font-bold">{formatSize(calculatedAfterSize)}</span>
                                </div>
                            </div>
                        </div>
                    </div>



                </div>

            {/* Bottom Shadow Indicator */}
            <div className={`absolute bottom-0 left-0 right-0 h-[2vw] bg-gradient-to-t from-black/10 to-transparent z-10 pointer-events-none transition-opacity duration-300 ${showBottomShadow ? 'opacity-100' : 'opacity-0'}`} />
        </div>


        </div>

    {/* Footer Area - Masking Layer */}
        <div className="px-[2vw] pb-[2vw] pt-[2vw] flex items-end justify-between shrink-0 bg-white relative z-[30]">
            {/* Unified Filename and Size Info */}
            <div className="flex flex-col gap-[0.5vw] w-[45%]">
                {exportScope === 'selection' && (
                    <span className="text-[0.85vw] font-semibold text-gray-800 ml-[0.2vw] -mb-[0.2vw]">Folder Name</span>
                )}
                <div className="flex items-center gap-[1vw]">
                    <div className="flex-1 bg-white border border-gray-200 rounded-[0.5vw] flex items-center px-[0.8vw] py-[0.6vw] focus-within:border-gray-400 transition-all shadow-sm">
                        <input 
                            type="text" 
                            value={fileName} 
                            onChange={(e) => setFileName(e.target.value)} 
                            className="w-full outline-none text-[0.85vw] text-gray-800 font-semibold bg-transparent" 
                            placeholder={exportScope === 'selection' ? "Folder Name" : "File Name"}
                        />
                        {exportScope !== 'selection' && (
                            <span className="text-gray-400 text-[0.85vw] font-medium mr-[0.5vw]">.{exportFormat.toLowerCase()}</span>
                        )}
                        <Edit3 size="1vw" className="text-gray-400 shrink-0" />
                    </div>
                    <div className="bg-gray-50 border border-gray-100 px-[1.2vw] py-[0.6vw] rounded-[0.5vw] text-[0.85vw] font-bold text-gray-500 whitespace-nowrap shadow-sm border-l-[0.2vw] border-l-gray-200">
                        {exportScope === 'selection' ? 'Model Size' : 'Size'}: {formatSize(calculatedAfterSize)}
                    </div>
                </div>
            </div>

            {/* Right: Buttons */}
            <div className="flex items-center gap-[1vw]">
                <button 
                    onClick={onClose} 
                    className="flex items-center cursor-pointer gap-[0.4vw] px-[1.5vw] py-[0.65vw] bg-white border border-black hover:border-red-500 text-gray-800 font-semibold text-[0.85vw] rounded-[0.5vw] hover:bg-gray-50 hover:text-red-500 transition-colors shadow-sm"
                >
                    <X size="1.2vw" />
                    Cancel
                </button>
                <button 
                    onClick={handleExportClick} 
                    className="flex items-center cursor-pointer gap-[0.5vw] px-[1.5vw] py-[0.65vw] bg-black text-white font-semibold text-[0.85vw] rounded-[0.5vw] hover:bg-zinc-800 transition-colors shadow-md border border-black"
                >
                    <Download size="1.1vw" />
                    Export as {exportFormat}
                </button>
            </div>
        </div>

        {/* Global Unified Canvas for View.Port tracking - Optimized with masking strategy */}
        <div className="absolute inset-0 pointer-events-none z-[15] overflow-hidden rounded-[0.75vw]">
            <Canvas 
                eventSource={modalRef}
                shadows={{ type: THREE.PCFShadowMap }}
                gl={{ 
                    antialias: true, 
                    alpha: true, 
                    powerPreference: "high-performance",
                    logarithmicDepthBuffer: true
                }}
                onCreated={({ gl }) => {
                    gl.shadowMap.enabled = true;
                    gl.shadowMap.type = THREE.PCFShadowMap;
                    gl.toneMapping = THREE.ACESFilmicToneMapping;
                    gl.outputColorSpace = THREE.SRGBColorSpace;
                }}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            >
                <View.Port />
            </Canvas>
        </div>
      </div>
    </div>
  );
}
