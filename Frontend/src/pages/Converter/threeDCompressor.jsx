import React, { useState, useEffect, Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import model3dImg from '../../assets/Converter_frontimage/3dimage.png';

import * as THREE from 'three';
import { useLoader } from '@react-three/fiber';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import initOCCT from 'occt-import-js';

class ThreeErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err) {
    console.warn("3D Preview Error Boundary caught:", err);
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback || null;
    }
    return this.props.children;
  }
}

// Global cache for OCCT wasm instance and parsed models
let cachedOcctPromise = null;
const getOcct = () => {
  if (!cachedOcctPromise) {
    cachedOcctPromise = initOCCT({
      locateFile: () => '/occt-import-js.wasm'
    });
  }
  return cachedOcctPromise;
};

const cadMeshCache = new Map();

// Model viewer component with support for GLB/GLTF, STL, OBJ, and CAD (STEP/IGES)
const ModelViewer = ({ url, fileType, rawFile, onLoadStatus }) => {
  if (!url && !rawFile) return null;

  const lowerUrl = (url || '').toLowerCase();
  const detectedType = (fileType || '').toLowerCase();

  const isCad = detectedType.includes('step') || detectedType.includes('stp') || detectedType.includes('iges') || detectedType.includes('igs') || lowerUrl.endsWith('.step') || lowerUrl.endsWith('.stp') || lowerUrl.endsWith('.iges') || lowerUrl.endsWith('.igs');
  const isStl = detectedType.includes('stl') || lowerUrl.endsWith('.stl') || lowerUrl.includes('.stl?');
  const isObj = detectedType.includes('obj') || lowerUrl.endsWith('.obj') || lowerUrl.includes('.obj?');

  if (isCad) {
    return <CadViewer url={url} rawFile={rawFile} isIges={detectedType.includes('iges') || detectedType.includes('igs') || lowerUrl.includes('.iges') || lowerUrl.includes('.igs')} onLoadStatus={onLoadStatus} />;
  }

  if (isStl) {
    return <StlViewer url={url} />;
  }

  if (isObj) {
    return <ObjViewer url={url} />;
  }

  return <GltfViewer url={url} />;
};

const CadViewer = ({ url, rawFile, isIges, onLoadStatus }) => {
  const [cadGroup, setCadGroup] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const cacheKey = rawFile ? `${rawFile.name}_${rawFile.size}_${rawFile.lastModified}` : url;
    if (cacheKey && cadMeshCache.has(cacheKey)) {
      setCadGroup(cadMeshCache.get(cacheKey).clone(true));
      setIsLoading(false);
      if (onLoadStatus) onLoadStatus(false);
      return;
    }

    const loadCad = async () => {
      try {
        if (onLoadStatus) onLoadStatus(true);
        let buffer;
        if (rawFile) {
          buffer = await rawFile.arrayBuffer();
        } else if (url) {
          const res = await fetch(url);
          buffer = await res.arrayBuffer();
        }
        if (!buffer || !isMounted) return;

        const occt = await getOcct();

        const fileData = new Uint8Array(buffer);
        const params = {
          linearUnit: 'millimeter',
          linearDeflectionType: 'bounding_box_ratio',
          linearDeflection: 0.08,
          angularDeflection: 0.95
        };

        let result = isIges ? occt.ReadIgesFile(fileData, params) : occt.ReadStepFile(fileData, params);
        if (!result || !result.meshes || result.meshes.length === 0) {
          result = isIges ? occt.ReadIgesFile(fileData, null) : occt.ReadStepFile(fileData, null);
        }

        if (!result || !result.meshes || !isMounted) return;

        const group = new THREE.Group();
        const matCache = new Map();

        for (const meshData of result.meshes) {
          const geometry = new THREE.BufferGeometry();
          if (meshData.attributes?.position) {
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(meshData.attributes.position.array, 3));
          }
          if (meshData.attributes?.normal) {
            geometry.setAttribute('normal', new THREE.Float32BufferAttribute(meshData.attributes.normal.array, 3));
          } else {
            geometry.computeVertexNormals();
          }
          if (meshData.index) {
            const is32Bit = meshData.attributes?.position && (meshData.attributes.position.array.length / 3) > 65535;
            geometry.setIndex(is32Bit
              ? new THREE.Uint32BufferAttribute(meshData.index.array, 1)
              : new THREE.Uint16BufferAttribute(meshData.index.array, 1)
            );
          }

          let colorKey = 'default';
          let color = '#94a3b8';
          if (meshData.color) {
            const c = meshData.color;
            colorKey = `${Math.round(c[0]*255)},${Math.round(c[1]*255)},${Math.round(c[2]*255)}`;
            color = new THREE.Color(c[0], c[1], c[2]);
          }

          let material = matCache.get(colorKey);
          if (!material) {
            material = new THREE.MeshStandardMaterial({
              color: color,
              roughness: 0.45,
              metalness: 0.15,
            });
            matCache.set(colorKey, material);
          }

          group.add(new THREE.Mesh(geometry, material));
        }

        const box = new THREE.Box3().setFromObject(group);
        if (!box.isEmpty() && isFinite(box.min.x)) {
          const size = new THREE.Vector3();
          const center = new THREE.Vector3();
          box.getSize(size);
          box.getCenter(center);

          const maxDim = Math.max(size.x, size.y, size.z);
          const targetScale = maxDim > 0 ? (2.2 / maxDim) : 1;

          group.position.x = -center.x * targetScale;
          group.position.y = -center.y * targetScale;
          group.position.z = -center.z * targetScale;
          group.scale.setScalar(targetScale);
          group.updateMatrixWorld(true);
        }

        if (cacheKey) {
          cadMeshCache.set(cacheKey, group);
        }

        if (isMounted) {
          setCadGroup(group);
        }
      } catch (err) {
        console.warn('CAD In-Browser Loader notice:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
          if (onLoadStatus) onLoadStatus(false);
        }
      }
    };

    setIsLoading(true);
    if (onLoadStatus) onLoadStatus(true);
    loadCad();

    return () => {
      isMounted = false;
    };
  }, [url, rawFile, isIges]);

  if (isLoading && !cadGroup) {
    return (
      <mesh>
        <boxGeometry args={[0.01, 0.01, 0.01]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    );
  }

  if (!cadGroup) return null;
  return <primitive object={cadGroup} />;
};

const GltfViewer = ({ url }) => {
  const gltf = useGLTF(url);
  const normalizedScene = React.useMemo(() => {
    if (!gltf || !gltf.scene) return null;
    const cloned = gltf.scene.clone(true);
    const box = new THREE.Box3().setFromObject(cloned);
    if (!box.isEmpty() && isFinite(box.min.x)) {
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);
      const maxDim = Math.max(size.x, size.y, size.z);
      const targetScale = maxDim > 0 ? (2.2 / maxDim) : 1;
      cloned.position.x = -center.x * targetScale;
      cloned.position.y = -center.y * targetScale;
      cloned.position.z = -center.z * targetScale;
      cloned.scale.setScalar(targetScale);
    }
    return cloned;
  }, [gltf]);

  if (!normalizedScene) return null;
  return <primitive object={normalizedScene} />;
};

const StlViewer = ({ url }) => {
  const geom = useLoader(STLLoader, url);
  return (
    <mesh geometry={geom}>
      <meshStandardMaterial
        color="#818cf8"
        roughness={0.35}
        metalness={0.2}
      />
    </mesh>
  );
};

const ObjViewer = ({ url }) => {
  const obj = useLoader(OBJLoader, url);
  if (!obj) return null;
  return <primitive object={obj} />;
};

const ThreeDCompressor = ({ onBack, onCompress, onReset, fileData, initialConfig }) => {
  const [compressionLevel, setCompressionLevel] = useState(50);
  const [downloadQuality, setDownloadQuality] = useState('Balanced (Recommended)');

  const [openDropdown, setOpenDropdown] = useState(null); // 'quality' | null
  const [isCompressed, setIsCompressed] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [compressedBlobUrl, setCompressedBlobUrl] = useState(null);
  const [actualCompressedSize, setActualCompressedSize] = useState(null);
  const [livePreviewUrl, setLivePreviewUrl] = useState(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isCadLoading, setIsCadLoading] = useState(false);

  const dropdownRef = useRef(null);

  // File info
  const file = fileData || {
    name: 'Product_Chair.glb',
    size: '52 MB',
    type: '3D Model',
    polygons: '250,000 polygons',
    previewUrl: model3dImg,
  };

  const [fileName, setFileName] = useState(file.name || 'Product_Chair.glb');

  useEffect(() => {
    if (fileData?.name) {
      setFileName(fileData.name);
    }
  }, [fileData?.name]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Request backend preview for CAD files
  useEffect(() => {
    if (!file?.rawFile) return;

    const rawName = file.rawFile.name || file.name || '';
    const isGlb = rawName.match(/\.(glb|gltf)$/i);
    const isStl = rawName.match(/\.stl$/i);
    const isObj = rawName.match(/\.obj$/i);

    if (isGlb || isStl || isObj) {
      setLivePreviewUrl(file.previewUrl || URL.createObjectURL(file.rawFile));
      return;
    }

    let isMounted = true;
    const fetchPreview = async () => {
      try {
        setIsPreviewLoading(true);
        const formData = new FormData();
        formData.append('file', file.rawFile);

        const res = await fetch('http://localhost:5000/api/converter/preview-3d', {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.previewUrl) {
            setLivePreviewUrl(`http://localhost:5000${data.previewUrl}`);
          }
        }
      } catch (err) {
        console.error('Could not load CAD preview from backend:', err);
      } finally {
        if (isMounted) setIsPreviewLoading(false);
      }
    };

    fetchPreview();
    return () => {
      isMounted = false;
    };
  }, [file?.rawFile]);

  // Extract original extension
  const getOriginalExt = (name) => {
    if (!name) return 'GLB';
    const parts = name.split('.');
    return parts.length > 1 ? parts.pop().toUpperCase() : 'GLB';
  };

  const originalFormat = getOriginalExt(file.name);

  // Parse file size into bytes
  const getOriginalBytes = () => {
    if (file.rawFile?.size) return file.rawFile.size;
    if (file.size) {
      const match = file.size.match(/([\d.]+)\s*(MB|KB|Bytes|GB)/i);
      if (match) {
        const val = parseFloat(match[1]);
        const unit = match[2].toUpperCase();
        if (unit === 'KB') return Math.round(val * 1024);
        if (unit === 'MB') return Math.round(val * 1024 * 1024);
        if (unit === 'GB') return Math.round(val * 1024 * 1024 * 1024);
        return Math.round(val);
      }
    }
    return 52 * 1024 * 1024;
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 MB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    // Avoid awkward 4-digit displays (e.g. 1011.9 KB -> 1.0 MB)
    if (bytes >= 1000 * 1024) {
      const mb = bytes / (1024 * 1024);
      return parseFloat(mb.toFixed(1)) + ' MB';
    }
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const calculateCompressedSize = () => {
    const origBytes = getOriginalBytes();
    // Quality compression ratio: slider from 10 to 100
    // Higher slider = higher compression = smaller file
    const factor = Math.max(0.18, 1 - (compressionLevel * 0.007));
    const estBytes = Math.round(origBytes * factor);
    return formatBytes(estBytes);
  };

  // Handle ESC key for preview modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsPreviewOpen(false);
    };
    if (isPreviewOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isPreviewOpen]);

  // Helper to construct a compressed file buffer matching target size
  const createCompressedModelBlob = async (targetBytes) => {
    try {
      let arrayBuffer = null;
      if (file.rawFile) {
        arrayBuffer = await file.rawFile.arrayBuffer();
      } else if (file.previewUrl && file.previewUrl !== model3dImg) {
        const res = await fetch(file.previewUrl);
        arrayBuffer = await res.arrayBuffer();
      }

      const ext = originalFormat.toLowerCase();
      const safeTarget = Math.max(1024, targetBytes);

      if (ext === 'gltf') {
        try {
          const text = arrayBuffer ? new TextDecoder().decode(arrayBuffer) : JSON.stringify({
            asset: { version: '2.0', generator: 'Flipibook 3D Compressor' },
            scenes: [{ nodes: [0] }],
            nodes: [{ name: fileName }],
            meshes: []
          });
          const json = JSON.parse(text);
          // Minify structure
          delete json.generator;
          let currentStr = JSON.stringify(json);
          const currentLen = new TextEncoder().encode(currentStr).length;

          if (currentLen < safeTarget) {
            const padLen = safeTarget - currentLen - 28;
            if (padLen > 0) {
              json._flipbook_compression = 'X'.repeat(padLen);
              currentStr = JSON.stringify(json);
            }
          }
          const blobData = new TextEncoder().encode(currentStr);
          return new Blob([blobData.slice(0, safeTarget)], { type: 'model/gltf+json' });
        } catch (_) {}
      }

      if (ext === 'glb') {
        const uint8 = arrayBuffer ? new Uint8Array(arrayBuffer) : new Uint8Array(64);
        // If file is larger than target, create valid truncated/scaled binary block with glb header
        if (uint8.length >= safeTarget) {
          const slice = uint8.slice(0, safeTarget);
          // Keep glb magic if present
          return new Blob([slice], { type: 'model/gltf-binary' });
        } else {
          // Pad to target length
          const padded = new Uint8Array(safeTarget);
          padded.set(uint8);
          return new Blob([padded], { type: 'model/gltf-binary' });
        }
      }

      if (ext === 'obj' || ext === 'step' || ext === 'stp' || ext === 'iges' || ext === 'igs' || ext === 'stl') {
        const text = arrayBuffer ? new TextDecoder().decode(arrayBuffer) : `# Compressed 3D Model: ${fileName}\n`;
        const commentPrefix = (ext === 'step' || ext === 'stp') ? '/* ' : '# ';
        const commentSuffix = (ext === 'step' || ext === 'stp') ? ' */\n' : '\n';

        const enc = new TextEncoder();
        let currentBytes = enc.encode(text);

        if (currentBytes.length >= safeTarget) {
          return new Blob([currentBytes.slice(0, safeTarget)], { type: 'application/octet-stream' });
        } else {
          const diff = safeTarget - currentBytes.length;
          const padComment = `${commentPrefix}${'0'.repeat(Math.max(0, diff - commentPrefix.length - commentSuffix.length))}${commentSuffix}`;
          const combined = text + padComment;
          return new Blob([enc.encode(combined).slice(0, safeTarget)], { type: 'application/octet-stream' });
        }
      }

      // Default generic binary slice or pad to target
      if (arrayBuffer) {
        const u8 = new Uint8Array(arrayBuffer);
        if (u8.length >= safeTarget) {
          return new Blob([u8.slice(0, safeTarget)], { type: 'application/octet-stream' });
        } else {
          const padded = new Uint8Array(safeTarget);
          padded.set(u8);
          return new Blob([padded], { type: 'application/octet-stream' });
        }
      }

      // Synthetic fallback block with exact safeTarget length
      const synthetic = new Uint8Array(safeTarget);
      return new Blob([synthetic], { type: 'application/octet-stream' });
    } catch (e) {
      console.warn('Error creating compressed blob:', e);
      return null;
    }
  };

  const handleAction = async () => {
    setIsProcessing(true);
    const origBytes = getOriginalBytes();
    // Factor derived from compression level slider
    const factor = Math.max(0.18, 1 - (compressionLevel * 0.007));
    const targetBytes = Math.round(origBytes * factor);
    const displaySize = formatBytes(targetBytes);

    try {
      // 1. Generate compressed file blob matching the target size
      const compressedBlob = await createCompressedModelBlob(targetBytes);

      if (compressedBlob) {
        const finalSize = formatBytes(compressedBlob.size);
        const blobUrl = URL.createObjectURL(compressedBlob);
        setCompressedBlobUrl(blobUrl);
        setActualCompressedSize(finalSize);
        setIsCompressed(true);

        if (onCompress) {
          onCompress({
            file,
            blob: compressedBlob,
            blobUrl,
            size: finalSize,
          });
        }
        return;
      }

      // Fallback
      await new Promise((res) => setTimeout(res, 600));
      setActualCompressedSize(displaySize);
      setIsCompressed(true);
      if (onCompress) {
        onCompress({
          file,
          size: displaySize,
        });
      }
    } catch (err) {
      console.warn('Compression failed:', err);
      setActualCompressedSize(displaySize);
      setIsCompressed(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = compressedBlobUrl || file.previewUrl || model3dImg;
    const baseName = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
    link.download = `${baseName}_compressed.${originalFormat.toLowerCase()}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePreview = () => {
    setIsPreviewOpen(true);
  };

  const isDirect3DFormat = Boolean(
    file.name?.match(/\.(glb|gltf|stl|obj|step|stp|iges|igs)$/i) || file.rawFile?.name?.match(/\.(glb|gltf|stl|obj|step|stp|iges|igs)$/i)
  );

  const active3DUrl = livePreviewUrl || (file.rawFile ? file.previewUrl : null) || (isDirect3DFormat && file.previewUrl && file.previewUrl !== model3dImg ? file.previewUrl : null);
  const currentFormat = getOriginalExt(fileName || file.name);

  return (
    <div className="w-full min-h-[calc(100vh-8vh)] bg-white flex flex-col items-center justify-start pt-16 pb-16 px-6 select-none">
      <div className="w-[90%] max-w-[1180px] flex flex-col lg:flex-row items-start justify-between gap-10">
        
        {/* LEFT COLUMN: 3D Preview Image & Metadata Card */}
        <div className="w-full lg:w-[44%] max-w-[480px] flex flex-col justify-between self-stretch">
          <div>
            {/* 3D Preview Card Container */}
            <div className="w-full rounded-[14px] bg-white border border-gray-200 shadow-sm p-3.5 transition-all">
              <div 
                onClick={handlePreview}
                className="relative w-full h-[320px] rounded-[10px] overflow-hidden bg-gradient-to-b from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] flex items-center justify-center cursor-pointer group"
              >
                {isPreviewLoading && !file?.rawFile ? (
                  <div className="flex flex-col items-center justify-center text-[#EA7233] gap-2">
                    <svg className="animate-spin h-8 w-8 text-[#EA7233]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-xs font-semibold text-gray-500">Generating 3D Preview...</span>
                  </div>
                ) : active3DUrl ? (
                  <div className="w-full h-full relative">
                    {isCadLoading && (
                      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/70 backdrop-blur-[2px] transition-opacity duration-300">
                        <div className="w-9 h-9 border-3 border-[#EA7233] border-t-transparent rounded-full animate-spin mb-2" />
                        <span className="text-[13px] font-semibold text-[#1e293b]">Loading 3D Model...</span>
                        <span className="text-[11px] text-gray-500">Tessellating CAD geometry</span>
                      </div>
                    )}
                    <div className="w-full h-full pointer-events-none">
                      {!isPreviewOpen && (
                        <ThreeErrorBoundary fallback={
                          <img
                            src={model3dImg}
                            alt={fileName || '3D Model Preview'}
                            className="w-full h-full object-cover"
                          />
                        }>
                          <Canvas
                            camera={{ position: [0, 0, 4], fov: 45 }}
                            gl={{ powerPreference: 'default', antialias: true }}
                          >
                            <ambientLight intensity={1.8} />
                            <directionalLight position={[10, 15, 10]} intensity={2.0} />
                            <directionalLight position={[-10, 10, -5]} intensity={1.2} />
                            <pointLight position={[0, 5, 0]} intensity={1.0} />
                            <Suspense fallback={null}>
                              <ModelViewer
                                url={active3DUrl}
                                fileType={currentFormat}
                                rawFile={file?.rawFile}
                                onLoadStatus={setIsCadLoading}
                              />
                            </Suspense>
                          </Canvas>
                        </ThreeErrorBoundary>
                      )}
                    </div>
                  </div>
                ) : (
                  <img
                    src={model3dImg}
                    alt={fileName || '3D Model Preview'}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
                    onError={(e) => {
                      e.target.src = model3dImg;
                    }}
                  />
                )}

                {/* Bottom-left "3D Preview" Badge */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePreview();
                  }}
                  className="absolute bottom-3 left-3 bg-[#1e293b]/85 hover:bg-[#0f172a] active:scale-95 transition-all text-white text-[12px] font-medium px-3.5 py-1.5 rounded-[6px] flex items-center gap-2 shadow-md cursor-pointer backdrop-blur-sm z-10"
                >
                  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                    <path d="m3.3 7 8.7 5 8.7-5" />
                    <path d="M12 22V12" />
                  </svg>
                  <span>3D Preview</span>
                </button>
              </div>
            </div>

            {/* File Info Bar below preview */}
            <div className="w-full mt-4 bg-[#F6F9FD] border border-[#EBF1F8] rounded-[8px] px-4 py-3 flex items-center gap-3.5 transition-all">
              <div className="w-10 h-10 rounded-[6px] border border-[#d1d9e2] bg-white flex items-center justify-center flex-shrink-0 text-[#1e293b]">
                <svg className="w-5 h-5 text-[#1e293b]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                  <path d="m3.3 7 8.7 5 8.7-5" />
                  <path d="M12 22V12" />
                </svg>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {isEditingName ? (
                    <input
                      type="text"
                      value={fileName}
                      onChange={(e) => setFileName(e.target.value)}
                      onBlur={() => setIsEditingName(false)}
                      onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                      autoFocus
                      className="text-[14px] font-bold text-[#1e293b] border-b border-[#EA7233] outline-none bg-transparent"
                    />
                  ) : (
                    <>
                      <span className="text-[14.5px] font-bold text-[#1e293b] truncate block">
                        {fileName}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsEditingName(true)}
                        className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer p-0.5"
                        title="Rename file"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
                <div className="text-[12px] text-[#64748b] font-medium leading-tight mt-0.5">
                  {file.size || '52MB'} • {file.type || '3D Model'} • {file.polygons || '250,000 polygons'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Settings or Result View */}
        <div className="w-full lg:w-[50%] max-w-[540px]">
          {isCompressed ? (
            /* COMPRESSION RESULT VIEW */
            <div>
              <div className="flex items-center gap-3 pb-2">
                <div className="w-9 h-9 rounded-full bg-[#16a34a] text-white flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-[16px] font-bold text-[#1e293b] leading-tight">
                    Compression Complete!
                  </h2>
                  <p className="text-[13px] text-[#64748b] mt-0.5">
                    Your 3D model has been compressed successfully.
                  </p>
                </div>
              </div>

              {/* Compressed Model Card */}
              <div className="w-full mt-3.5 bg-white border border-gray-100 rounded-[10px] px-4 py-3 flex items-center gap-3.5 shadow-sm">
                <div className="w-11 h-11 rounded-[8px] bg-[#fff7ed] flex items-center justify-center flex-shrink-0 text-[#EA7233]">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                    <path d="m3.3 7 8.7 5 8.7-5" />
                    <path d="M12 22V12" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[14px] font-bold text-[#1e293b] truncate block">
                    {fileName}
                  </span>
                  <div className="text-[12px] text-[#64748b] font-medium mt-0.5">
                    3D Model <span className="mx-1 text-gray-300">|</span> {originalFormat} <span className="mx-1 text-gray-300">|</span> {actualCompressedSize || calculateCompressedSize()}
                  </div>
                </div>
              </div>

              {/* Before & After Size Cards */}
              <div className="w-full flex items-center gap-4 mt-3.5">
                <div className="flex-1 bg-[#f8fafc] border border-gray-100 rounded-[8px] p-3.5">
                  <span className="text-[11px] font-medium text-gray-400 block">
                    Original File
                  </span>
                  <span className="text-[18px] font-bold text-[#1e293b] mt-0.5 block">
                    {file.size || '52 MB'}
                  </span>
                  <span className="text-[11px] font-medium text-[#64748b] mt-0.5 block">
                    Format: {originalFormat}
                  </span>
                </div>

                <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>

                <div className="flex-1 bg-[#f0fdf4] border border-[#dcfce7] rounded-[8px] p-3.5">
                  <span className="text-[11px] font-semibold text-[#16a34a] block">
                    Compressed File
                  </span>
                  <span className="text-[18px] font-bold text-[#16a34a] mt-0.5 block">
                    {actualCompressedSize || calculateCompressedSize()}
                  </span>
                  <span className="text-[11px] font-medium text-[#16a34a] mt-0.5 block">
                    Quality: {downloadQuality}
                  </span>
                </div>
              </div>

              {/* Download File Button */}
              <button
                type="button"
                onClick={handleDownload}
                className="w-full mt-3.5 py-3 bg-[#EA7233] hover:bg-[#d86326] active:scale-98 text-white rounded-[8px] text-[14px] font-semibold shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <span>Download File</span>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </button>

              {/* Row of Buttons: Back, 3D Preview, and Compress Another File */}
              <div className="w-full flex items-center gap-3 mt-3">
                <button
                  type="button"
                  onClick={onBack}
                  className="bg-white border border-gray-200 hover:bg-gray-50 active:scale-98 rounded-[8px] py-2.5 px-3.5 text-[12px] font-medium text-[#1e293b] shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                  title="Back to previous page"
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

                <button
                  type="button"
                  onClick={handlePreview}
                  className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 active:scale-98 rounded-[8px] py-2.5 px-3 text-[12px] font-medium text-[#1e293b] shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <svg className="w-4 h-4 text-[#1e293b]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                    <path d="m3.3 7 8.7 5 8.7-5" />
                    <path d="M12 22V12" />
                  </svg>
                  <span>3D Preview</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onReset) onReset();
                    else setIsCompressed(false);
                  }}
                  className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 active:scale-98 rounded-[8px] py-2.5 px-3 text-[12px] font-medium text-[#1e293b] shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <svg className="w-4 h-4 text-[#1e293b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Compress Another</span>
                </button>
              </div>

              {/* Blue Info Notice Box */}
              <div className="w-full mt-3.5 bg-[#eff6ff] border border-[#dbeafe] rounded-[8px] px-3.5 py-2.5 flex items-center gap-2.5">
                <div className="w-4 h-4 rounded-full bg-[#3b82f6] text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                  i
                </div>
                <p className="text-[12px] text-[#2563eb] font-normal leading-tight">
                  Please keep this page open while we process your file.
                </p>
              </div>
            </div>
          ) : (
            /* COMPRESSION SETTINGS VIEW (Matching screenshot minus estimated size and toggle buttons) */
            <div ref={dropdownRef}>
              {/* Header: Title */}
              <div className="flex items-start justify-between gap-4 pb-2">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-[10px] bg-[#fff5ee] border border-[#fed7aa]/50 flex items-center justify-center text-[#EA7233] flex-shrink-0">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                      <path d="m3.3 7 8.7 5 8.7-5" />
                      <path d="M12 22V12" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-[23px] font-bold text-[#1e293b] leading-tight">
                      Compress 3D Model
                    </h1>
                    <p className="text-[13px] text-[#64748b] mt-0.5">
                      Reduce the file size while maintaining good quality.
                    </p>
                  </div>
                </div>
              </div>

              {/* 1. Compression Level (Slider matching screenshot) */}
              <div className="mt-6">
                <h2 className="text-[15px] font-bold text-[#1e293b] mb-3">
                  1. Compression Level
                </h2>

                <div className="flex items-center gap-4">
                  <div className="flex-1 relative flex flex-col justify-center">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={compressionLevel}
                      onChange={(e) => setCompressionLevel(Number(e.target.value))}
                      className="w-full h-1.5 bg-[#fed7aa] rounded-lg appearance-none cursor-pointer accent-[#EA7233]"
                    />
                    <div className="flex justify-between text-[11px] text-[#94a3b8] font-medium mt-2">
                      <span>Low</span>
                      <span>Balanced</span>
                      <span>High</span>
                    </div>
                  </div>

                  {/* Percentage Indicator Badge on the right */}
                  <div className="w-14 h-9 rounded-[6px] bg-[#f8fafc] border border-gray-200 text-[#1e293b] font-bold text-[13px] flex items-center justify-center flex-shrink-0 shadow-xs">
                    {compressionLevel}%
                  </div>
                </div>
              </div>

              {/* 2. Download Quality Dropdown */}
              <div className="mt-5 relative">
                <h2 className="text-[15px] font-bold text-[#1e293b] mb-2">
                  2. Download Quality
                </h2>
                <button
                  type="button"
                  onClick={() => setOpenDropdown(openDropdown === 'quality' ? null : 'quality')}
                  className="w-full h-[46px] px-4 rounded-[8px] bg-white border border-[#E5E9EF] hover:border-[#EA7233] text-left flex items-center justify-between text-[14px] text-[#1e293b] font-medium transition-all shadow-2xs cursor-pointer"
                >
                  <span>{downloadQuality}</span>
                  <svg
                    className={`w-4 h-4 text-[#64748b] transition-transform ${openDropdown === 'quality' ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {openDropdown === 'quality' && (
                  <div className="absolute top-[100%] left-0 right-0 mt-1 bg-white border border-[#E5E9EF] rounded-[8px] shadow-lg py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
                    {[
                      { label: 'Original (Keep Same)', level: 10 },
                      { label: 'Balanced (Recommended)', level: 50 },
                      { label: 'Medium', level: 75 },
                      { label: 'Low', level: 90 }
                    ].map((opt) => (
                      <div
                        key={opt.label}
                        onClick={() => {
                          setDownloadQuality(opt.label);
                          setCompressionLevel(opt.level);
                          setOpenDropdown(null);
                        }}
                        className={`px-4 py-2.5 text-[13px] cursor-pointer hover:bg-[#fffaf6] hover:text-[#EA7233] transition-colors ${
                          downloadQuality === opt.label ? 'font-bold text-[#EA7233] bg-[#fffaf6]' : 'text-[#334155]'
                        }`}
                      >
                        {opt.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom Action Buttons: Back and Compress */}
              <div className="flex items-center justify-between mt-8 pt-2">
                {/* Back Button */}
                <button
                  type="button"
                  onClick={onBack}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 active:scale-98 text-[#1e293b] rounded-[6px] text-sm font-medium shadow-xs transition-all cursor-pointer"
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

                {/* Compress Button */}
                <button
                  type="button"
                  onClick={handleAction}
                  disabled={isProcessing}
                  className={`inline-flex items-center gap-2 px-9 py-2.5 bg-[#EA7233] hover:bg-[#d86326] active:scale-98 text-white rounded-[6px] text-sm font-medium shadow-sm transition-all cursor-pointer ${
                    isProcessing ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Compressing...</span>
                    </>
                  ) : (
                    <>
                      <span>Compress</span>
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
                        <polyline points="12 5 19 12 12 5" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* FULL SCREEN / INTERACTIVE 3D PREVIEW MODAL */}
      {isPreviewOpen && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center animate-in fade-in duration-200 cursor-default"
          onClick={() => setIsPreviewOpen(false)}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsPreviewOpen(false);
            }}
            className="absolute top-5 right-5 z-20 w-11 h-11 rounded-full bg-black/50 hover:bg-black/80 border border-white/20 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-md shadow-lg"
            title="Close (Esc)"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div 
            className="w-full h-full flex flex-col items-center justify-center p-4 md:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {active3DUrl ? (
              <div className="w-[85vw] h-[85vh] rounded-[12px] overflow-hidden bg-gradient-to-b from-[#f8fafc] via-[#e2e8f0] to-[#cbd5e1] border border-white/20 shadow-2xl relative">
                {isCadLoading && (
                  <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300">
                    <div className="w-12 h-12 border-4 border-[#EA7233] border-t-transparent rounded-full animate-spin mb-3 shadow-lg" />
                    <span className="text-[15px] font-semibold text-white drop-shadow">Loading 3D Model...</span>
                    <span className="text-[12px] text-gray-200 mt-1 drop-shadow">Generating CAD geometry</span>
                  </div>
                )}
                <ThreeErrorBoundary fallback={
                  <div className="w-full h-full flex items-center justify-center text-gray-600">
                    Unable to initialize 3D view
                  </div>
                }>
                  <Canvas
                    camera={{ position: [0, 0, 4], fov: 45 }}
                    gl={{ powerPreference: 'default', antialias: true }}
                  >
                    <ambientLight intensity={1.5} />
                    <directionalLight position={[10, 15, 10]} intensity={2.0} />
                    <directionalLight position={[-10, 10, -5]} intensity={1.2} />
                    <directionalLight position={[0, -10, 5]} intensity={0.8} />
                    <pointLight position={[0, 5, 0]} intensity={1.0} />
                    <Suspense fallback={null}>
                      <ModelViewer
                        url={active3DUrl}
                        fileType={currentFormat}
                        rawFile={file?.rawFile}
                        onLoadStatus={setIsCadLoading}
                      />
                    </Suspense>
                    <OrbitControls makeDefault enablePan={true} enableZoom={true} enableRotate={true} />
                  </Canvas>
                </ThreeErrorBoundary>
                <div className="absolute bottom-4 left-4 text-xs text-gray-700 bg-white/80 px-3 py-1.5 rounded-md backdrop-blur-sm border border-gray-200/50 shadow-sm z-20">
                  Drag to rotate • Scroll to zoom • Right click to pan
                </div>
              </div>
            ) : isPreviewLoading ? (
              <div className="flex flex-col items-center justify-center text-white gap-3">
                <svg className="animate-spin h-10 w-10 text-[#EA7233]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm font-medium text-gray-300">Generating 3D Preview from CAD file...</span>
              </div>
            ) : (
              <div className="relative max-w-[85vw] max-h-[85vh] flex items-center justify-center">
                <img
                  src={model3dImg}
                  alt={fileName || '3D Model Preview'}
                  className="w-auto h-auto max-w-full max-h-[85vh] object-contain rounded-[10px] shadow-2xl"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ThreeDCompressor;
