import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import AlertModal from '../../AlertModal';
import { process3DDropEvent } from '../utils/modelDropHandler';

export default function AddModelModal({ isOpen, onClose, onAdd }) {
    const [isDragging, setIsDragging] = useState(false);
    const [errorModal, setErrorModal] = useState({ isOpen: false, message: '' });
    const [isPackaging, setIsPackaging] = useState(false);

    const validExtensions = ['glb', 'gltf', 'obj', 'fbx', 'stl', 'step', 'stp', '3ds', 'lwo', 'low', 'iges', 'igs', 'zip', 'rar', '7z', 'tar', 'gz', 'tgz', 'bz2'];

    if (!isOpen) return null;

    const handleFile = async (source) => {
        if (!source) return;

        let fileToProcess = source;

        if (source instanceof FileList) {
            if (source.length === 0) return;
            if (source.length > 1) {
                try {
                    setIsPackaging(true);
                    const dropResult = await process3DDropEvent(source);
                    setIsPackaging(false);
                    if (dropResult?.file) {
                        onAdd(dropResult.file);
                        onClose();
                        return;
                    }
                } catch (err) {
                    setIsPackaging(false);
                    console.error("Multi-file package notice:", err);
                }
            }
            fileToProcess = source[0];
        }

        const ext = fileToProcess.name.split('.').pop().toLowerCase();
        if (!validExtensions.includes(ext)) {
            setErrorModal({
                isOpen: true,
                message: `The file format ".${ext}" is not supported. Please upload one of the following: ${validExtensions.join(', ').toUpperCase()}`
            });
            return;
        }

        onAdd(fileToProcess);
        onClose();
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        try {
            setIsPackaging(true);
            const dropResult = await process3DDropEvent(e.dataTransfer);
            setIsPackaging(false);
            if (dropResult && dropResult.file) {
                onAdd(dropResult.file);
                onClose();
            }
        } catch (err) {
            setIsPackaging(false);
            console.error("Add model drop error:", err);
            const file = e.dataTransfer.files?.[0];
            if (file) {
                handleFile(file);
            } else {
                setErrorModal({
                    isOpen: true,
                    message: err.message || "Failed to process dropped folder or file."
                });
            }
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-[1.25vw] w-[35vw] p-[2vw] shadow-2xl relative border border-gray-100 flex flex-col">
                
                {/* Header */}
                <div className="flex justify-between items-center mb-[1.5vw]">
                    <h2 className="text-[1.2vw] font-bold text-gray-800">Add 3D Model</h2>
                    <button 
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                    >
                        <Icon icon="ic:round-close" width="1.5vw" height="1.5vw" />
                    </button>
                </div>

                {/* Subtitle */}
                <div className="flex items-center gap-[0.2vw] mb-[1.5vw]">
                    <span className="text-red-500 text-[0.9vw] font-bold mt-[0.1vw]">*</span>
                    <p className="text-[0.75vw] font-medium text-gray-400">
                        You Can Add New Model (or Model Folder) To The Existing 3d Scene
                    </p>
                </div>

                {/* Upload Area */}
                <div 
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
                    onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
                    onDrop={handleDrop}
                    className={`border-[0.1vw] border-dashed rounded-[1vw] p-[2.5vw] flex flex-col items-center justify-center transition-all cursor-pointer select-none ${
                        isDragging ? 'border-[#5d5efc] bg-[#5d5efc]/5 scale-[1.02]' : 'border-gray-300 hover:border-[#5d5efc] hover:bg-gray-50/50'
                    }`}
                    onClick={() => document.getElementById('add-model-input').click()}
                >
                    <input 
                        type="file" 
                        id="add-model-input" 
                        className="hidden" 
                        multiple
                        onChange={(e) => handleFile(e.target.files)}
                        accept=".glb,.gltf,.obj,.fbx,.stl,.step,.stp,.3ds,.lwo,.low,.iges,.igs,.zip,.rar,.7z,.tar,.gz,.tgz,.bz2"
                    />
                    
                    <div className="text-[0.9vw] font-semibold text-gray-500 tracking-tight transition-colors mb-[1.2vw]">
                        {isDragging ? (
                            <span className="text-[#5d5efc] font-bold">Drop File or Folder to Upload</span>
                        ) : isPackaging ? (
                            <span className="text-[#5d5efc] font-bold animate-pulse">Packaging Folder with Textures...</span>
                        ) : (
                            <>Drag & Drop File / Folder or <span className="text-[#5d5efc] font-bold">Upload</span></>
                        )}
                    </div>

                    <div className="mb-[1.5vw]">
                        <Icon icon="solar:upload-linear" width="3vw" height="3vw" className={isDragging ? "text-[#5d5efc]" : "text-gray-400"} />
                    </div>

                    <div className="text-[0.6vw] text-gray-400 font-medium tracking-wide text-center">
                        Supported Formats : <span className="uppercase text-gray-500 font-semibold">{validExtensions.join(', ')}</span>
                    </div>
                </div>

                <AlertModal
                    isOpen={errorModal.isOpen}
                    onClose={() => setErrorModal({ isOpen: false, message: '' })}
                    type="error"
                    title="Invalid File Format"
                    message={errorModal.message}
                    confirmText="Got it"
                />

            </div>
        </div>
    );
}
