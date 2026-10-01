import React, { useRef, useState } from "react";
import { Icon } from "@iconify/react";
import MaterialProperties from "./Customized";
import { process3DDropEvent } from "./utils/modelDropHandler";

export default function RightPanel({ 
    onFileProcess, 
    hasModel, 
    onExport,
    autoRotate, 
    setAutoRotate, 
    xrayMode,
    setXrayMode,
    isLoading, 
    materialSettings, 
    onUpdateMaterialSetting,
    activeAccordion,
    setActiveAccordion,
    transformValues,
    onManualTransformChange,
    onResetTransform,
    onResetFactorSettings,
    onUvUnwrap,
    onMapUpload,
    selectedTextureId,
    onSelectTexture,
    savedHdrs,
    onDeleteHdr,
    hasAnimations,
    isAnimationPlaying,
    onToggleAnimation,
    hotspots = [],
    activeHotspotId = null,
    onHotspotClick,
    onAddHotspot,
    onEditHotspot,
    onDeleteHotspot,
    selectedMaterial,
    // Right panel mode: 'hotspot' displays only 3D hotspots list, 'edit' displays only material/position/lighting
    rightPanelMode = 'edit',
    onRightPanelModeChange
}) {
  const fileRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileChange = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (files.length === 1) {
      onFileProcess(files[0]);
    } else {
      try {
        const dropResult = await process3DDropEvent(files);
        if (dropResult && dropResult.file) {
          onFileProcess(dropResult.file, dropResult);
        }
      } catch (err) {
        console.error("Multi-file processing error:", err);
        onFileProcess(files[0]);
      }
    }
    e.target.value = null;
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    if (isLoading) return;

    try {
      const dropResult = await process3DDropEvent(e.dataTransfer);
      if (dropResult && dropResult.file) {
        onFileProcess(dropResult.file, dropResult);
      }
    } catch (err) {
      console.error("Drop processing error:", err);
      const file = e.dataTransfer.files?.[0];
      if (file) {
        onFileProcess(file);
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoading) setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  return (
    <div className="w-full h-full bg-white flex flex-col overflow-hidden border-l border-gray-300">
      {/* TOP CONTROLS BAR */}
      <div className="p-[1vw] flex items-center justify-between bg-white shrink-0">
        <div className="flex items-center gap-[1vw]">
          {/* Auto Rotate Toggle */}
          <div className="flex items-center gap-[0.75vw]">
            <div
              onClick={() => hasModel && setAutoRotate(!autoRotate)}
              className={`w-[2.75vw] h-[1.5vw] rounded-full flex items-center px-[0.25vw] transition-all duration-300 ${
                hasModel 
                  ? `cursor-pointer ${autoRotate ? "bg-[#5d5efc]" : "bg-gray-200"}` 
                  : "bg-gray-100 cursor-not-allowed opacity-50"
              }`}
            >
              <div className={`w-[1vw] h-[1vw] bg-white rounded-full shadow-sm transition-transform duration-300 ${autoRotate ? "translate-x-[1.25vw]" : "translate-x-0"}`} />
            </div>
            <span className={`text-[0.75vw] font-semibold ${hasModel ? "text-gray-800" : "text-gray-400"}`}>Auto Rotate</span>
          </div>
        </div>

        {/* Export Button */}
        <button 
          onClick={onExport}
          disabled={!hasModel}
          className={`py-[0.65vw] px-[1.5vw] rounded-[0.5vw] text-[0.75vw] font-semibold flex items-center gap-[0.5vw] transition-all ${
            hasModel 
              ? "bg-[#5d5efc] text-white shadow-lg shadow-[#5d5efc]/20 active:scale-95 cursor-pointer hover:bg-[#4d4eec]" 
              : "bg-gray-200 text-gray-400 cursor-not-allowed opacity-60"
          }`}
        >
          <Icon icon="bitcoin-icons:export-outline" width="1.25vw" height="1.25vw" className="stroke-2" />
          Export 3D
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!hasModel ? (
          <div className="flex-1 bg-[#f5f6f7] rounded-t-[1.25vw] p-[2vw] flex flex-col">
            <h1 className="text-[1.1vw] font-semibold text-gray-900 mb-[2vw] leading-tight">
              Upload your 3D Object
            </h1>

            <div className="flex items-center gap-[0.75vw] mb-[2.5vw]">
              <span className="text-[0.85vw] font-semibold text-gray-900 whitespace-nowrap">Your Model</span>
              <div className="h-[0.1vw] flex-1 bg-gray-300"></div>
            </div>

            {/* Upload Area */}
            <div
              onClick={() => fileRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`w-full min-h-[11vw] border-[0.12vw] border-dashed rounded-[1.25vw] bg-white flex flex-col items-center justify-center p-[1.5vw] transition-all cursor-pointer group shadow-sm select-none ${
                isDragOver 
                    ? "border-[#5d5efc] bg-[#5d5efc]/5 cursor-copy scale-[1.02]" 
                    : "border-gray-300 hover:border-[#5d5efc] hover:bg-gray-50/50 hover:shadow-md"
              }`}
            >
              <div className="text-[0.85vw] font-semibold text-gray-500 mb-[1.2vw] tracking-tight group-hover:text-gray-700 transition-colors text-center">
                {isDragOver ? (
                    <span className="text-[#5d5efc] font-bold">Drop File or Folder to Upload</span>
                ) : (
                    <>Drag & Drop File / Folder or <span className="text-[#5d5efc] font-bold">Upload</span></>
                )}
              </div>

              <div className={`mb-[1.2vw] transition-all duration-200 group-hover:scale-110 flex items-center justify-center ${isDragOver ? "text-[#5d5efc]" : "text-gray-400 group-hover:text-[#5d5efc]"}`}>
                <Icon icon="solar:upload-linear" width="2.5vw" height="2.5vw" />
              </div>

              <div className="text-center flex flex-col items-center">
                <div className="text-[0.65vw] font-bold text-gray-500 uppercase tracking-wide mb-[0.25vw] text-center">
                  Supported Formats
                </div>
                <div className="text-[0.55vw] text-gray-400 leading-relaxed uppercase max-w-[15vw] font-medium text-center">
                  GLB, GLTF, OBJ, FBX, STL, STEP, STP, 3DS, LWO, IGES, IGS, ZIP, RAR, 7Z, TAR
                </div>
              </div>
            </div>

            <input
              ref={fileRef}
              type="file"
              multiple
              accept=".glb,.gltf,.obj,.fbx,.stl,.step,.stp,.3ds,.lwo,.low,.iges,.igs,.zip,.rar,.7z,.tar,.gz,.tgz,.bz2"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        ) : (
          <div className="flex flex-col h-full bg-gray-50 overflow-hidden">
            {/* ─── HOTSPOT MODE: SHOW ONLY HOTSPOTS LIST ─── */}
            {rightPanelMode === 'hotspot' ? (
              <div className="flex-1 flex flex-col bg-white overflow-hidden animate-in fade-in duration-200">
                {/* Hotspot Header */}
                <div className="px-[1.2vw] py-[0.9vw] border-b border-gray-200 flex items-center justify-between bg-white shrink-0 shadow-sm">
                  <div className="flex items-center gap-[0.6vw]">
                    <div className="w-[1.9vw] h-[1.9vw] rounded-[0.5vw] bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <Icon icon="solar:map-point-wave-bold-duotone" width="1.2vw" height="1.2vw" />
                    </div>
                    <div>
                      <div className="flex items-center gap-[0.4vw]">
                        <h2 className="text-[0.88vw] font-bold text-gray-900 leading-tight">3D Hotspots</h2>
                        {hotspots.length > 0 && (
                          <span className="text-[0.62vw] font-bold px-[0.4vw] py-[0.1vw] rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">
                            {hotspots.length}
                          </span>
                        )}
                      </div>
                      <p className="text-[0.58vw] text-gray-500 leading-tight">
                        Click any hotspot to focus camera. Click Add to place pin.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => typeof onAddHotspot === 'function' && onAddHotspot()}
                    className="flex items-center gap-[0.35vw] px-[0.8vw] py-[0.45vw] rounded-[0.5vw] bg-[#5d5efc] hover:bg-[#4d4eec] text-white text-[0.72vw] font-bold shadow-md shadow-indigo-200 active:scale-95 transition-all cursor-pointer"
                    title="Click Add then click anywhere on model to place a hotspot pin"
                  >
                    <Icon icon="solar:add-circle-bold" width="0.95vw" height="0.95vw" />
                    <span>Add Hotspot</span>
                  </button>
                </div>

                {/* Hotspots List (Full height scroll) */}
                <div className="flex-1 overflow-y-auto p-[0.9vw] space-y-[0.5vw] custom-scrollbar">
                  {hotspots.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-[2vw] text-center bg-gray-50/70 rounded-[0.8vw] border border-dashed border-gray-200 my-[1vw]">
                      <div className="w-[3.2vw] h-[3.2vw] rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 mb-[0.8vw]">
                        <Icon icon="solar:map-point-add-bold-duotone" width="1.8vw" height="1.8vw" />
                      </div>
                      <h3 className="text-[0.88vw] font-bold text-gray-800 mb-[0.3vw]">No Hotspots Added</h3>
                      <p className="text-[0.65vw] text-gray-500 max-w-[15vw] mb-[1.2vw] leading-relaxed">
                        Click "Add Hotspot" above, then click anywhere on your 3D model to place an interactive label pin.
                      </p>
                      <button
                        type="button"
                        onClick={() => typeof onAddHotspot === 'function' && onAddHotspot()}
                        className="flex items-center gap-[0.4vw] px-[1.1vw] py-[0.55vw] rounded-[0.5vw] bg-[#5d5efc] hover:bg-[#4d4eec] text-white text-[0.75vw] font-bold shadow-md shadow-indigo-200 active:scale-95 transition-all cursor-pointer"
                      >
                        <Icon icon="solar:add-circle-bold" width="0.95vw" height="0.95vw" />
                        <span>Place First Hotspot</span>
                      </button>
                    </div>
                  ) : (
                    hotspots.map((hs, i) => {
                      const hsId = hs.id || `hs_${i}`;
                      const isAct = activeHotspotId != null && (
                        String(activeHotspotId) === String(hs.id) ||
                        String(activeHotspotId) === String(hsId) ||
                        activeHotspotId === i
                      );
                      return (
                        <div
                          key={hsId}
                          onClick={() => typeof onHotspotClick === 'function' && onHotspotClick(hs)}
                          className={`flex items-center gap-[0.6vw] p-[0.75vw] rounded-[0.7vw] border cursor-pointer transition-all duration-150 group ${
                            isAct
                              ? "bg-indigo-50/90 border-indigo-400 shadow-sm ring-1 ring-indigo-400/40"
                              : "bg-white border-gray-200 hover:bg-gray-50/80 hover:border-gray-300"
                          }`}
                        >
                          {/* Number Badge */}
                          <div
                            className={`w-[1.6vw] h-[1.6vw] rounded-full flex items-center justify-center text-[0.68vw] font-bold shrink-0 transition-colors shadow-sm ${
                              isAct
                                ? "bg-red-500 text-white shadow-red-200"
                                : "bg-gray-100 text-gray-700 border border-gray-200 group-hover:bg-indigo-50 group-hover:text-indigo-600"
                            }`}
                          >
                            {i + 1}
                          </div>

                          {/* Label + Mesh Info */}
                          <div className="flex-1 min-w-0">
                            <p className={`text-[0.78vw] font-bold truncate leading-tight ${isAct ? "text-indigo-900" : "text-gray-900"}`}>
                              {hs.label || `Hotspot ${i + 1}`}
                            </p>
                            <p className="text-[0.6vw] text-gray-400 truncate leading-tight mt-[0.1vw]">
                              Mesh: <span className="text-gray-600 font-medium">{hs.meshName || "Surface"}</span>
                            </p>
                          </div>

                          {/* Right side: Selected badge + Action buttons */}
                          <div
                            className="flex items-center gap-[0.35vw] shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {isAct && (
                              <span className="text-[0.58vw] font-bold text-red-600 bg-red-50 border border-red-200 px-[0.45vw] py-[0.15vw] rounded-full leading-tight">
                                Active
                              </span>
                            )}
                            {/* Edit Button */}
                            <button
                              type="button"
                              onClick={() => typeof onEditHotspot === 'function' && onEditHotspot(hs)}
                              className="p-[0.35vw] rounded-[0.35vw] text-gray-400 hover:text-gray-800 hover:bg-gray-100 transition-colors cursor-pointer"
                              title="Edit Hotspot Label"
                            >
                              <Icon icon="solar:pen-bold" width="0.85vw" height="0.85vw" />
                            </button>
                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => typeof onDeleteHotspot === 'function' && onDeleteHotspot(hs.id || hsId)}
                              className="p-[0.35vw] rounded-[0.35vw] text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Delete Hotspot"
                            >
                              <Icon icon="solar:trash-bin-trash-bold" width="0.85vw" height="0.85vw" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              /* ─── EDIT MODE: SHOW MATERIAL / POSITION / LIGHTING (NO HOTSPOTS LIST) ─── */
              <div className="flex-1 flex flex-col h-full overflow-hidden animate-in fade-in duration-200">
                {/* X-Ray View Toggle Bar */}
                <div className="px-[1vw] py-[0.6vw] bg-white border-t border-b border-gray-200/70 flex items-center justify-between shrink-0 select-none">
                  <div className="flex items-center gap-[0.55vw]">
                    <div className="w-[1.6vw] h-[1.6vw] rounded-[0.4vw] bg-[#00aaff]/10 flex items-center justify-center text-[#00aaff]">
                      <Icon icon="solar:scanner-bold-duotone" width="1.05vw" height="1.05vw" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[0.75vw] font-semibold text-gray-800 leading-tight">X-Ray View</span>
                      <span className="text-[0.55vw] text-gray-400 leading-tight">Translucent inspection</span>
                    </div>
                  </div>
                  <div
                    onClick={() => setXrayMode && setXrayMode(!xrayMode)}
                    className={`w-[2.75vw] h-[1.5vw] rounded-full flex items-center px-[0.25vw] cursor-pointer transition-all duration-300 ${
                      xrayMode ? "bg-[#00aaff] shadow-sm shadow-[#00aaff]/30" : "bg-gray-200"
                    }`}
                  >
                    <div className={`w-[1vw] h-[1vw] bg-white rounded-full shadow-sm transition-transform duration-300 ${xrayMode ? "translate-x-[1.25vw]" : "translate-x-0"}`} />
                  </div>
                </div>

                {/* Material Properties scroll area */}
                <div className="flex-1 overflow-y-auto p-[1vw] custom-scrollbar">
                  <MaterialProperties 
                      controls={materialSettings} 
                      updateControl={onUpdateMaterialSetting}
                      activePanel={activeAccordion}
                      setActivePanel={setActiveAccordion}
                      transformValues={transformValues}
                      onManualTransformChange={onManualTransformChange}
                      onResetTransform={onResetTransform}
                      onResetFactor={onResetFactorSettings}
                      onMapUpload={onMapUpload}
                      selectedTextureId={selectedTextureId}
                      onSelectTexture={onSelectTexture}
                      savedHdrs={savedHdrs}
                      onDeleteHdr={onDeleteHdr}
                      hasAnimations={hasAnimations}
                      isAnimationPlaying={isAnimationPlaying}
                      onToggleAnimation={onToggleAnimation}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 0.35vw;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 0.5vw;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </div>
  );
}
