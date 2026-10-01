import React, { useState, Suspense, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as THREE from "three";
import { Icon } from "@iconify/react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Environment, useProgress, ContactShadows, TransformControls, useGLTF } from "@react-three/drei";
import RightPanel from "./ThreedRightpanel";
import EditorInfoBox from "./EditorInfoBox";
import EditorToolbar from "./EditorToolbar";
import TextureGalleryBar from "./TextureGalleryBar";
import TopToolbar from "./TopToolbar";
import AnimatedGizmo from "./Components/AnimatedGizmo";
import { GlobalLoader } from "./Components/GlobalLoader";
import RenderModel from "./Components/ModelLoaders";
import SmoothOrbitControls from "./Components/SmoothOrbitControls";
import useModalHistory from "./hooks/useModalHistory";
import Export3DModal from "./Components/Export3DModal";
import AddModelModal from "./Components/AddModelModal";
import ModelGalleryModal from "./Components/ModelGalleryModal";
import BlenderInfiniteGrid from "./Components/BlenderInfiniteGrid";
import AlertModal from "../AlertModal";
import { GLTFExporter, STLExporter, OBJLoader, FBXLoader, STLLoader } from "three-stdlib";
import { LWOLoader } from "three/examples/jsm/loaders/LWOLoader.js";
import { TDSLoader } from "three/examples/jsm/loaders/TDSLoader.js";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import { MeshoptEncoder } from "meshoptimizer";
import initOCCT from "occt-import-js";
import CameraModal from "./Components/CameraModal";
import AddMaterial from "./Components/AddMaterial";
import Hotspot3DOverlay from "./Components/Hotspot3DOverlay";
import HotspotModal from "./Components/HotspotModal";
import { resolveUploadsPath } from "../../utils/supabaseUtils";
import { getFromDB, saveToDB } from "../../utils/dbUtils";
import { process3DDropEvent } from "./utils/modelDropHandler";
import { useOutletContext } from "react-router-dom";
import axios from "axios";
import { useToast } from "../../components/CustomToast";

// Safe GLTFExporter patch to guarantee options.animations is always a valid Array and never undefined
if (GLTFExporter && GLTFExporter.prototype && !GLTFExporter.prototype._isSafeExporterPatched) {
  GLTFExporter.prototype._isSafeExporterPatched = true;
  const originalParse = GLTFExporter.prototype.parse;
  GLTFExporter.prototype.parse = function (input, onDone, onError, options = {}) {
    const safeOptions = { ...(options || {}) };
    if (!Array.isArray(safeOptions.animations)) {
      safeOptions.animations = [];
    }
    return originalParse.call(this, input, onDone, onError, safeOptions);
  };
}

// Patch Three.js background shaders from ShaderChunk to smoothly mingle the HDRI with the studio gray background color (#393939)
// and apply the user's Reflection slider to the HDRI in real-time.
const bgPatchGlsl = /* glsl */`
  // backgroundIntensity encodes opacity (integer: 0..100) and reflection (fractional: 0.0..0.3 -> 0.0..3.0)
  float bgOpacity = clamp( floor( backgroundIntensity ) / 100.0, 0.0, 1.0 );
  float bgReflection = max( 0.0, fract( backgroundIntensity ) * 10.0 );

  // Apply Reflection slider to HDRI radiance in the world
  texColor.rgb *= bgReflection;

  // #393939 in linear sRGB space
  vec3 studioGray = vec3( 0.039547, 0.039547, 0.039547 );
  texColor.rgb = mix( studioGray, texColor.rgb, bgOpacity );
`;

if (THREE.ShaderLib.backgroundCube && THREE.ShaderChunk.backgroundCube_frag) {
  THREE.ShaderLib.backgroundCube.fragmentShader = THREE.ShaderChunk.backgroundCube_frag.replace(
    'texColor.rgb *= backgroundIntensity;',
    bgPatchGlsl
  );
}

if (THREE.ShaderLib.background && THREE.ShaderChunk.background_frag) {
  THREE.ShaderLib.background.fragmentShader = THREE.ShaderChunk.background_frag.replace(
    'texColor.rgb *= backgroundIntensity;',
    bgPatchGlsl
  );
}

// Safely restores skeleton bones to bind pose without the Three.js Skeleton.pose() root bone multiplication bug
function safelyRestoreSkeletonBindPose(skeleton) {
  if (!skeleton || !Array.isArray(skeleton.bones) || !skeleton.boneInverses) return;
  for (let i = 0; i < skeleton.bones.length; i++) {
    const bone = skeleton.bones[i];
    const inv = skeleton.boneInverses[i];
    if (bone && inv) {
      bone.matrixWorld.copy(inv).invert();
    }
  }
  for (let i = 0; i < skeleton.bones.length; i++) {
    const bone = skeleton.bones[i];
    if (!bone) continue;
    if (bone.parent) {
      bone.matrix.copy(bone.parent.matrixWorld).invert().multiply(bone.matrixWorld);
    } else {
      bone.matrix.copy(bone.matrixWorld);
    }
    bone.matrix.decompose(bone.position, bone.quaternion, bone.scale);
  }
}

// Controller to ensure environment lighting, background opacity (mingled with gray color), blur, and rotation
// update in real-time across every frame so drei re-renders cannot override user settings.
function SceneEnvironmentController({ envRotation = 0, worldOpacity = 0, worldBlur = 0, reflection = 50, isCapturing = false }) {
  const { scene } = useThree();
  const rotRef = useRef(0);

  // Keep the ref current every render so useFrame always reads the latest value
  rotRef.current = (envRotation || 0) * (Math.PI / 180);

  // Apply immediately on mount and whenever properties change
  useEffect(() => {
    if (!scene) return;
    const rad = rotRef.current;
    if (scene.environmentRotation) {
      scene.environmentRotation.set(0, rad, 0);
    } else {
      scene.environmentRotation = new THREE.Euler(0, rad, 0);
    }
    if (scene.backgroundRotation) {
      scene.backgroundRotation.set(0, rad, 0);
    } else {
      scene.backgroundRotation = new THREE.Euler(0, rad, 0);
    }
    // Force background mesh material recompile if background texture was already assigned
    if (scene.background && scene.background.isTexture) {
      scene.background.version++;
    }
  }, [scene, envRotation]);

  // Enforce rotation, reflection, blur, and opacity every frame so drei re-renders cannot override it
  useFrame(() => {
    if (!scene) return;

    if (isCapturing) {
      if (scene.background) scene.background = null;
      return;
    }

    const rad = rotRef.current;
    if (scene.environmentRotation) {
      if (scene.environmentRotation.y !== rad) {
        scene.environmentRotation.set(0, rad, 0);
      }
    } else {
      scene.environmentRotation = new THREE.Euler(0, rad, 0);
    }
    if (scene.backgroundRotation && scene.backgroundRotation.y !== rad) {
      scene.backgroundRotation.set(0, rad, 0);
    }

    // Dynamic environment reflection intensity from Reflection slider
    const reflVal = reflection !== undefined ? reflection : 50;
    const targetEnvIntensity = reflVal <= 50 ? (reflVal / 50) : 1.0 + ((reflVal - 50) / 50) * 2.0;
    if (scene.environmentIntensity !== undefined && scene.environmentIntensity !== targetEnvIntensity) {
      scene.environmentIntensity = targetEnvIntensity;
    }

    // Dynamic background opacity & reflection (mingles smoothly with #393939 gray color and scales HDRI reflection)
    const targetOpacity = Math.max(0, Math.min(100, Math.round(worldOpacity ?? 0)));
    // Encode: integer part is opacity (0..100), fractional part is reflection / 10.0 (0.0..0.3)
    const encodedBgIntensity = targetOpacity + (targetEnvIntensity / 10.0);
    if (scene.backgroundIntensity !== encodedBgIntensity) {
      scene.backgroundIntensity = encodedBgIntensity;
    }

    // Dynamic background blur
    const targetBlur = Math.max(0, Math.min(1, (worldBlur ?? 0) / 100));
    if (scene.backgroundBlurriness !== targetBlur) {
      scene.backgroundBlurriness = targetBlur;
    }
  });

  return null;
}

// DirectionalSunLight ensures shadow updates dynamically with smooth, responsive softness
function DirectionalSunLight({ position, specular = 50, softness = 50 }) {
  const lightRef = useRef();
  const targetRef = useRef();

  // Dynamic shadow radius: scales from 1 (sharp, clean edge) to 28 (wide, soft blur)
  const shadowSoftRadius = 1 + ((softness ?? 50) / 100) * 27;

  useEffect(() => {
    if (lightRef.current && targetRef.current) {
      lightRef.current.target = targetRef.current;
    }
  }, []);

  useFrame(() => {
    if (lightRef.current) {
      if (targetRef.current && lightRef.current.target !== targetRef.current) {
        lightRef.current.target = targetRef.current;
      }
      if (lightRef.current.shadow) {
        if (lightRef.current.shadow.radius !== shadowSoftRadius) {
          lightRef.current.shadow.radius = shadowSoftRadius;
          lightRef.current.shadow.needsUpdate = true;
        }
      }
    }
  });

  return (
    <>
      <object3D ref={targetRef} position={[0, 0, 0]} />
      <directionalLight
        ref={lightRef}
        position={position}
        intensity={1.8 + ((specular ?? 50) / 100) * 0.8}
        castShadow
        shadow-bias={-0.0002}
        shadow-normalBias={0.03}
        shadow-radius={shadowSoftRadius}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-25}
        shadow-camera-right={25}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
        shadow-camera-near={0.1}
        shadow-camera-far={80}
      />
    </>
  );
}

export default function ThreedEditor() {
  const { modelId: urlModelId } = useParams();
  const navigate = useNavigate();

  const { 
    threedState, 
    setThreedState, 
    setSaveHandler, 
    setCanSave,
    setHasUnsavedChanges, 
    setIsSaving, 
    triggerSaveSuccess 
  } = useOutletContext();

  const toast = useToast();
  const backendUrl = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000').trim().replace(/\/+$/, '');

  const [models, setModels] = useState(threedState.models || (threedState.modelUrl ? [{
      id: "default",
      url: threedState.modelUrl,
      file: threedState.modelFile,
      type: threedState.modelType,
      name: threedState.modelName || "Model"
  }] : []));

  // Keeping original state vars for overall project info (like total filesize) or backward compatibility
  const [modelUrl, setModelUrl] = useState(models.length > 0 ? models[0].url : null);
  const [modelFile, setModelFile] = useState(models.length > 0 ? models[0].file : null); 
  const [modelType, setModelType] = useState(models.length > 0 ? models[0].type : "glb");
  const [autoRotate, setAutoRotate] = useState(false);
  const [xrayMode, setXrayMode] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(models.length === 0); // If model exists, don't collapse
  const [isTextureOpen, setIsTextureOpen] = useState(false);
  const [manualLoading, setManualLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingModelInfo, setLoadingModelInfo] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAnimationPlaying, setIsAnimationPlaying] = useState(true);
  const [modelHasAnimationsMap, setModelHasAnimationsMap] = useState({});
  const hasAnimations = useMemo(() => {
    return Object.values(modelHasAnimationsMap).some(Boolean);
  }, [modelHasAnimationsMap]);

  const handleHasAnimationsChange = useCallback((modelId, hasAnim) => {
    const boolVal = Boolean(hasAnim);
    setModelHasAnimationsMap(prev => {
      if (Boolean(prev[modelId]) === boolVal) return prev;
      return { ...prev, [modelId]: boolVal };
    });
  }, []);

  const loadingProgressRef = useRef(0);
  const loadingTimerRef = useRef(null);
  const conversionTickerRef = useRef(null);
  const mountingSafetyTimerRef = useRef(null);
  const isCompletingRef = useRef(false);
  const pendingModelIdRef = useRef(null);
  const modelsRef = useRef(models);

  useEffect(() => {
    modelsRef.current = models;
  }, [models]);

  const { active, progress } = useProgress();

  // Monotonic progress setter: guarantees percentage never decreases during loading
  const setSafeProgress = useCallback((val) => {
    if (isCompletingRef.current) return;
    const num = typeof val === 'function' ? val(loadingProgressRef.current) : Number(val);
    if (isNaN(num)) return;
    const clamped = Math.max(loadingProgressRef.current, Math.min(100, Math.round(num)));
    loadingProgressRef.current = clamped;
    setLoadingProgress(clamped);
  }, []);

  const clearAllLoadingTimers = useCallback(() => {
    if (loadingTimerRef.current) {
      clearInterval(loadingTimerRef.current);
      loadingTimerRef.current = null;
    }
    if (conversionTickerRef.current) {
      clearInterval(conversionTickerRef.current);
      conversionTickerRef.current = null;
    }
    if (mountingSafetyTimerRef.current) {
      clearTimeout(mountingSafetyTimerRef.current);
      mountingSafetyTimerRef.current = null;
    }
  }, []);

  const frameModelFullViewRef = useRef(null);
  const latestModelBoundsRef = useRef(null);
  const cameraAnimFrameRef = useRef(null);

  useEffect(() => {
    return () => {
      if (cameraAnimFrameRef.current) {
        cancelAnimationFrame(cameraAnimFrameRef.current);
      }
    };
  }, []);

  // Completion hook: triggered by GenericModel after double-RAF base positioning
  const handleModelReady = useCallback((modelId, bounds) => {
    if (bounds) {
      latestModelBoundsRef.current = bounds;
    }
    // Automatically position camera to show full view framing whenever any model is opened or uploaded
    if (typeof frameModelFullViewRef.current === 'function') {
      frameModelFullViewRef.current(bounds, false);
    }

    if (isCompletingRef.current) return;
    // Guard against non-pending model ONLY if there are multiple models loaded and IDs explicitly conflict
    if (pendingModelIdRef.current && modelId && String(pendingModelIdRef.current) !== String(modelId) && (modelsRef.current?.length > 1)) {
      console.warn(`[ThreedEditor] Skipping onModelReady for non-pending model: ${modelId} (pending: ${pendingModelIdRef.current})`);
      return;
    }

    isCompletingRef.current = true;
    clearAllLoadingTimers();

    loadingProgressRef.current = 100;
    setLoadingProgress(100);
    setLoadingText("Model ready on base!");

    // Hold at 100% for 380ms for visual satisfaction, then cleanly dismiss
    setTimeout(() => {
      setManualLoading(false);
      loadingProgressRef.current = 0;
      setLoadingProgress(0);
      setLoadingText("");
      setLoadingModelInfo(null);
      pendingModelIdRef.current = null;
      isCompletingRef.current = false;
    }, 380);
  }, [clearAllLoadingTimers]);

  // Smoothly advances progress while backend converts the model (45% -> 76%) so it never freezes
  const startConversionTicker = useCallback((ext, engineName = "OpenCASCADE") => {
    if (conversionTickerRef.current) clearInterval(conversionTickerRef.current);
    if (isCompletingRef.current) return;

    const upperExt = (ext || '3D').toUpperCase();
    let convCurrent = Math.max(45, loadingProgressRef.current);
    setSafeProgress(convCurrent);

    conversionTickerRef.current = setInterval(() => {
      if (isCompletingRef.current) return;
      const targetMax = 76;
      const remaining = targetMax - convCurrent;
      if (remaining > 0.4) {
        const step = Math.max(0.12, remaining * 0.04);
        convCurrent = Math.min(targetMax, convCurrent + step);
        setSafeProgress(Math.round(convCurrent));

        if (convCurrent < 54) {
          setLoadingText(`Converting ${upperExt} model with ${engineName}...`);
        } else if (convCurrent < 66) {
          setLoadingText("Tessellating 3D geometry & mesh surfaces...");
        } else {
          setLoadingText("Optimizing materials & compiling GLTF binary...");
        }
      }
    }, 220);
  }, [setSafeProgress]);

  const stopConversionTicker = useCallback(() => {
    if (conversionTickerRef.current) {
      clearInterval(conversionTickerRef.current);
      conversionTickerRef.current = null;
    }
  }, []);

  // Smoothly glides progress forward while Three.js mounts and positions the model on base grid
  const startMountingBridgeTicker = useCallback((initialPct) => {
    if (loadingTimerRef.current) clearInterval(loadingTimerRef.current);
    if (isCompletingRef.current) return;

    let cur = Math.max(loadingProgressRef.current, initialPct || 78);
    setSafeProgress(cur);

    loadingTimerRef.current = setInterval(() => {
      if (isCompletingRef.current) return;
      const targetMax = 95;
      const remaining = targetMax - cur;
      if (remaining > 0.3) {
        const step = Math.max(0.1, remaining * 0.06);
        cur = Math.min(targetMax, cur + step);
        setSafeProgress(Math.round(cur));

        if (cur < 88) {
          setLoadingText("Calculating bounds & normalizing scale...");
        } else {
          setLoadingText("Positioning model on base grid...");
        }
      }
    }, 180);

    // Watchdog: If GenericModel has mounted and is taking > 7s at 94%+, auto-complete cleanly
    if (mountingSafetyTimerRef.current) clearTimeout(mountingSafetyTimerRef.current);
    mountingSafetyTimerRef.current = setTimeout(() => {
      if (manualLoading && !isCompletingRef.current) {
        console.log("[ThreedEditor] Mounting watchdog auto-resolving ready state");
        handleModelReady(pendingModelIdRef.current);
      }
    }, 7000);
  }, [handleModelReady, manualLoading, setSafeProgress]);

  // Unified startModelLoading coordinator
  const startModelLoading = useCallback((modelInfo) => {
    clearAllLoadingTimers();
    isCompletingRef.current = false;
    pendingModelIdRef.current = modelInfo?.id ? String(modelInfo.id) : null;

    setLoadingModelInfo(modelInfo || null);
    const ext = (modelInfo?.type || modelInfo?.name?.split('.').pop() || '').toLowerCase();
    const isCad = ['step', 'stp', 'iges', 'igs'].includes(ext);
    const isArchive = ['.zip', '.rar', '.7z', '.tar', '.gz', '.tgz', '.bz2'].some(e => (modelInfo?.name || '').toLowerCase().endsWith(e));
    const isDirectGlb = ext === 'glb' || ext === 'gltf';

    loadingProgressRef.current = 10;
    setLoadingProgress(10);
    setManualLoading(true);

    if (isArchive) {
      setLoadingText("Unpacking 3D model archive & textures...");
    } else if (isCad) {
      setLoadingText("Preparing CAD model & OpenCASCADE engine...");
    } else if (isDirectGlb) {
      setLoadingText("Reading 3D GLB model...");
      let cur = 10;
      loadingTimerRef.current = setInterval(() => {
        if (isCompletingRef.current) return;
        if (cur < 85) {
          cur += (85 - cur) * 0.12;
          setSafeProgress(Math.round(cur));
          if (cur < 45) setLoadingText("Reading 3D scene geometry...");
          else if (cur < 70) setLoadingText("Processing textures & materials...");
          else setLoadingText("Calculating bounds & normalizing scale...");
        }
      }, 160);
    } else {
      setLoadingText(`Reading ${ext.toUpperCase() || '3D'} model file...`);
    }
  }, [clearAllLoadingTimers, setSafeProgress]);

  // Update progress from sub-loaders (e.g. CadModel)
  const handleModelProgress = useCallback((modelId, progressPct, stageText) => {
    if (pendingModelIdRef.current && modelId && String(pendingModelIdRef.current) !== String(modelId) && (modelsRef.current?.length > 1)) return;
    if (isCompletingRef.current) return;

    if (stageText) setLoadingText(stageText);
    if (typeof progressPct === 'number' && !isNaN(progressPct)) {
      setSafeProgress(progressPct);
    }
  }, [setSafeProgress]);

  // Sync with Drei useProgress if active (for external textures and secondary downloads)
  useEffect(() => {
    if (active && manualLoading && !isCompletingRef.current) {
      if (typeof progress === 'number' && progress > 0) {
        const mapped = Math.round(75 + (progress * 0.19));
        setSafeProgress(mapped);
      }
    }
  }, [active, progress, manualLoading, setSafeProgress]);

  // Safety stuck timer: only auto-dismiss if loading has stalled for 15 minutes (aligned with converter timeout & GlobalLoader)
  useEffect(() => {
    if (!manualLoading) return;
    const t = setTimeout(() => {
      console.warn("[ThreedEditor] Loading safety limit reached (15m) — clearing loader.");
      clearAllLoadingTimers();
      setManualLoading(false);
      loadingProgressRef.current = 0;
      setLoadingProgress(0);
      setLoadingText("");
      setLoadingModelInfo(null);
      pendingModelIdRef.current = null;
      isCompletingRef.current = false;
    }, 15 * 60 * 1000);
    return () => clearTimeout(t);
  }, [manualLoading, clearAllLoadingTimers]);

  const isGlobalLoading = manualLoading || active;
  
  // Model Statistics State
  const [modelStatsMap, setModelStatsMap] = useState({});
  const [modelStats, setModelStats] = useState(threedState.modelStats || { fileSize: "0 MB" });
  
  const controlsRef = React.useRef(null);
  const modelRef = React.useRef(null);
  const modelRefs = useRef(new Map());
  const glInstanceRef = useRef(null);
  const cameraInstanceRef = useRef(null);
  const originalTransformRef = useRef(null);
  const meshTransformsRef = useRef({});
  const handleSelectMaterialRef = useRef(null);
  const [meshTransformsState, setMeshTransformsState] = useState({});
  const lastUpdateRef = useRef(0);

  // Target Position State
  const [targetPosition, setTargetPosition] = useState({ x: 0, y: 0, z: 0 });

  const handleControlsChange = useCallback((e) => {
    const target = e?.target?.target;
    if (!target) return;
    const now = Date.now();
    if (now - lastUpdateRef.current > 50) {
      const nx = parseFloat(target.x.toFixed(2));
      const ny = parseFloat(target.y.toFixed(2));
      const nz = parseFloat(target.z.toFixed(2));
      setTargetPosition((prev) => {
        if (prev && prev.x === nx && prev.y === ny && prev.z === nz) {
          return prev;
        }
        return { x: nx, y: ny, z: nz };
      });
      lastUpdateRef.current = now;
    }
  }, []);

  const [modelMaterialLists, setModelMaterialLists] = useState({});
  const modelMaterialListsRef = useRef({});
  const [modelMaterialDataMap, setModelMaterialDataMap] = useState({});
  const sceneWrapperRef = useRef(null);

  // Full-view camera angle: automatically frames any uploaded or opened model in a stunning 3/4 perspective without clipping
  const frameModelFullView = useCallback((bounds, animate = false) => {
    if (bounds) {
      latestModelBoundsRef.current = bounds;
    }

    const tryFrame = (attemptsLeft = 6) => {
      const camera = cameraInstanceRef.current;
      const controls = controlsRef.current;
      const gl = glInstanceRef.current;

      if (!camera || !controls) {
        if (attemptsLeft > 0) {
          requestAnimationFrame(() => tryFrame(attemptsLeft - 1));
        }
        return;
      }

      // 1. Calculate model center and bounding radius
      let target = new THREE.Vector3(0, 1.0, 0);
      let radius = 2.5;

      // Primary: accurate world bounding box computed from all renderable geometry in sceneWrapperRef
      let box = new THREE.Box3();
      if (sceneWrapperRef.current) {
        sceneWrapperRef.current.traverse((child) => {
          if ((child.isMesh || child.isSkinnedMesh) && child.geometry) {
            if (!child.geometry.boundingBox) {
              try { child.geometry.computeBoundingBox(); } catch (_) {}
            }
            if (child.geometry.boundingBox) {
              try {
                const geomBox = child.geometry.boundingBox.clone().applyMatrix4(child.matrixWorld);
                if (!geomBox.isEmpty() && isFinite(geomBox.min.x)) {
                  box.union(geomBox);
                }
              } catch (_) {}
            }
          }
        });
      }

      if (!box.isEmpty() && isFinite(box.min.x)) {
        const center = new THREE.Vector3();
        const size = new THREE.Vector3();
        box.getCenter(center);
        box.getSize(size);
        target.copy(center);
        radius = Math.max(0.8, size.length() / 2);
      } else if (bounds) {
        // Fallback: bounds payload passed from GenericModel
        const h = bounds.height || (bounds.size?.y ? bounds.size.y * (bounds.targetScale || 1) : 2.0);
        const w = bounds.width || (bounds.size?.x ? bounds.size.x * (bounds.targetScale || 1) : 2.0);
        const d = bounds.depth || (bounds.size?.z ? bounds.size.z * (bounds.targetScale || 1) : 2.0);
        target.set(0, Math.max(0.2, h / 2), 0);
        radius = Math.max(0.8, Math.sqrt(w * w + h * h + d * d) / 2);
      }

      // 2. Compute optimal camera framing distance to fit the full model in view
      const fov = camera.fov || 45;
      const canvasEl = gl?.domElement;
      const aspect = (canvasEl && canvasEl.clientHeight > 0)
        ? (canvasEl.clientWidth / canvasEl.clientHeight)
        : (camera.aspect || 1.6);

      const vFOVRad = THREE.MathUtils.degToRad(fov) / 2;
      const hFOVRad = Math.atan(Math.tan(vFOVRad) * aspect);

      const distV = radius / Math.sin(vFOVRad);
      const distH = radius / Math.sin(hFOVRad);
      const fitDistance = Math.max(distV, distH);

      // 28% padding gives a comfortable, breathable margin around top, bottom, and sidebars
      const PADDING = 1.28;
      const distance = Math.max(2.8, Math.min(fitDistance * PADDING, 60));

      // 3. 3/4 elevated isometric/hero perspective (polar ~66° = ~24° elevation, azimuth ~38°)
      const phi = THREE.MathUtils.degToRad(66);
      const theta = THREE.MathUtils.degToRad(38);

      const sinPhi = Math.sin(phi);
      const cosPhi = Math.cos(phi);
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);

      const camX = target.x + distance * sinPhi * sinTheta;
      const camY = target.y + distance * cosPhi;
      const camZ = target.z + distance * sinPhi * cosTheta;

      camera.near = Math.min(0.05, distance / 50);
      camera.far = Math.max(1000, distance * 25);
      camera.updateProjectionMatrix();

      if (cameraAnimFrameRef.current) {
        cancelAnimationFrame(cameraAnimFrameRef.current);
        cameraAnimFrameRef.current = null;
      }

      if (!animate) {
        controls.target.copy(target);
        camera.position.set(camX, camY, camZ);
        camera.lookAt(target);
        controls.update();
        if (typeof controls.saveState === 'function') {
          controls.saveState();
        }
        setTargetPosition({
          x: parseFloat(target.x.toFixed(2)),
          y: parseFloat(target.y.toFixed(2)),
          z: parseFloat(target.z.toFixed(2))
        });
      } else {
        const startPos = camera.position.clone();
        const startTarget = controls.target.clone();
        const endPos = new THREE.Vector3(camX, camY, camZ);
        const endTarget = target.clone();
        const startTime = performance.now();
        const duration = 380; // ms

        const animateStep = (now) => {
          const elapsed = now - startTime;
          const progress = Math.min(1, elapsed / duration);
          // Smooth cubic ease-out
          const ease = 1 - Math.pow(1 - progress, 3);

          camera.position.lerpVectors(startPos, endPos, ease);
          controls.target.lerpVectors(startTarget, endTarget, ease);
          camera.lookAt(controls.target);
          controls.update();

          if (progress < 1) {
            cameraAnimFrameRef.current = requestAnimationFrame(animateStep);
          } else {
            cameraAnimFrameRef.current = null;
            if (typeof controls.saveState === 'function') {
              controls.saveState();
            }
            setTargetPosition({
              x: parseFloat(endTarget.x.toFixed(2)),
              y: parseFloat(endTarget.y.toFixed(2)),
              z: parseFloat(endTarget.z.toFixed(2))
            });
          }
        };
        cameraAnimFrameRef.current = requestAnimationFrame(animateStep);
      }
    };

    tryFrame();
  }, []);

  frameModelFullViewRef.current = frameModelFullView;
  const [materialList, setMaterialList] = useState(threedState.materialList || []);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [selectedTexture, setSelectedTexture] = useState(null);
  
  useEffect(() => {
      // Debug log to confirm texture selection
      if (selectedTexture) console.log("Texture Selected:", selectedTexture.name);
  }, [selectedTexture]);

  const [showExportModal, setShowExportModal] = useState(false);
  const [showAddModelModal, setShowAddModelModal] = useState(false);
  const [showModelGalleryModal, setShowModelGalleryModal] = useState(false);
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);
  const [materialRefreshKey, setMaterialRefreshKey] = useState(0);

  // 3D Mesh Hotspots State
  const [hotspots, setHotspots] = useState(threedState.hotspots || []);
  const [activeHotspotId, setActiveHotspotId] = useState(null);
  const [showHotspotModal, setShowHotspotModal] = useState(false);
  const [editingHotspot, setEditingHotspot] = useState(null);
  const [isPlacingHotspot, setIsPlacingHotspot] = useState(false);
  const isPlacingHotspotRef = useRef(false);
  // Right panel mode: 'edit' shows material/position/lighting, 'hotspot' shows only the hotspot list
  const [rightPanelMode, setRightPanelMode] = useState('edit');
  // Ref: true while the camera is animating to a hotspot — prevents pointerMissed from clearing activeHotspotId
  const isHotspotFocusingRef = useRef(false);

  useEffect(() => {
    isPlacingHotspotRef.current = isPlacingHotspot;
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isPlacingHotspot) {
        setIsPlacingHotspot(false);
        isPlacingHotspotRef.current = false;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlacingHotspot]);

  // Right Panel & Sidebar State
  const [activeAccordion, setActiveAccordion] = useState("factor"); // "factor" | "position" | "lighting"

  const defaultTransform = useMemo(() => ({
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 }
  }), []);

  const sanitizeTransformValues = useCallback((t) => {
      if (!t) return defaultTransform;
      const pos = t.position || { x: 0, y: 0, z: 0 };
      const rot = t.rotation || { x: 0, y: 0, z: 0 };
      let sc = t.scale || { x: 1, y: 1, z: 1 };

      let sx = typeof sc.x === 'number' ? sc.x : 1;
      let sy = typeof sc.y === 'number' ? sc.y : 1;
      let sz = typeof sc.z === 'number' ? sc.z : 1;

      // If scale was corrupted/saved as percentage (>= 50), sanitize back to 1.0 multiplier
      if (Math.abs(sx) >= 50) sx = 1;
      if (Math.abs(sy) >= 50) sy = 1;
      if (Math.abs(sz) >= 50) sz = 1;

      return {
          position: { x: pos.x ?? 0, y: pos.y ?? 0, z: pos.z ?? 0 },
          rotation: { x: rot.x ?? 0, y: rot.y ?? 0, z: rot.z ?? 0 },
          scale: { x: sx, y: sy, z: sz }
      };
  }, [defaultTransform]);

  // Transform Tools State
  const [transformMode, setTransformMode] = useState(null); // 'translate', 'rotate', 'scale', null
  const transformModeRef = useRef(transformMode);
  transformModeRef.current = transformMode;
  const [transformValues, setRawTransformValues] = useState(() => sanitizeTransformValues(threedState.transformValues));

  const setTransformValues = useCallback((valOrFn) => {
      setRawTransformValues(prev => {
          const raw = typeof valOrFn === 'function' ? valOrFn(prev) : valOrFn;
          const next = sanitizeTransformValues(raw);
          if (prev &&
              prev.position?.x === next.position.x &&
              prev.position?.y === next.position.y &&
              prev.position?.z === next.position.z &&
              prev.rotation?.x === next.rotation.x &&
              prev.rotation?.y === next.rotation.y &&
              prev.rotation?.z === next.rotation.z &&
              prev.scale?.x === next.scale.x &&
              prev.scale?.y === next.scale.y &&
              prev.scale?.z === next.scale.z) {
              return prev;
          }
          return next;
      });
  }, [sanitizeTransformValues]);

  // --- History Management ---
  const [modelName, setModelName] = useState(threedState.modelName);
  const [selectedTextureId, setSelectedTextureId] = useState(null);

  const [materialSettings, setMaterialSettings] = useState(threedState.materialSettings);
  const [savedHdrs, setSavedHdrs] = useState([]);

  // Load saved custom HDRs from IndexedDB on mount
  useEffect(() => {
    const loadSavedHdrs = async () => {
      try {
        const list = await getFromDB('saved_hdrs');
        if (Array.isArray(list) && list.length > 0) {
          const restored = list.map(item => {
            if (item.file instanceof Blob) {
              const ext = (item.name || '').split('.').pop().toLowerCase();
              const isHDREXR = ext === 'hdr' || ext === 'exr';
              const url = URL.createObjectURL(item.file) + (isHDREXR ? `#.${ext}` : '');
              return { ...item, url };
            }
            return item;
          });
          setSavedHdrs(restored);

          const activeId = await getFromDB('active_hdr_id');
          if (activeId) {
            const matched = restored.find(h => h.id === activeId || h.id === `custom_${activeId}` || `custom_${h.id}` === activeId);
            if (matched && matched.url) {
              setMaterialSettings(prev => ({
                ...prev,
                environment: matched.id.startsWith('custom_') ? matched.id : `custom_${matched.id}`,
                customEnvMap: matched.url,
                maps: { ...(prev.maps || {}), envMap: matched.url }
              }));
            }
          }
        }
      } catch (e) {
        console.warn("[ThreedEditor] Error loading saved HDRs:", e);
      }
    };
    loadSavedHdrs();
  }, []);

  const [resetKey, setResetKey] = useState(0);
  
  const getInitialSet = (val) => {
    if (!val) return new Set();
    try {
        if (val instanceof Set) return new Set(val);
        if (Array.isArray(val)) return new Set(val);
        if (val && typeof val[Symbol.iterator] === 'function') return new Set(val);
    } catch(e) {}
    return new Set();
  };

  const [hiddenMaterials, setHiddenMaterials] = useState(getInitialSet(threedState.hiddenMaterials));
  const [deletedMaterials, setDeletedMaterials] = useState(getInitialSet(threedState.deletedMaterials));

  // Screenshot State
  const [isScreenshotOpen, setIsScreenshotOpen] = useState(false);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [formatErrorModal, setFormatErrorModal] = useState({ isOpen: false, title: 'Invalid Model Format', message: '' });

  const { 
    state: historyState, 
    past,
    set: pushHistory, 
    undo, 
    redo, 
    canUndo, 
    canRedo,
    resetHistory,
    update: updateHistory,
    historyRef,
    indexRef
  } = useModalHistory({
      models: models,
      transformValues: transformValues,
      materialSettings: materialSettings,
      modelName: modelName,
      hiddenMaterials: Array.from(hiddenMaterials),
      deletedMaterials: Array.from(deletedMaterials),
      modelMaterialLists: modelMaterialLists,
      selectedMaterial: selectedMaterial,
      selectedTexture: selectedTexture,
      selectedTextureId: selectedTextureId,
      meshTransforms: meshTransformsRef.current || {},
      hotspots: hotspots
  });

  const stateRef = useRef({ 
      models, 
      transformValues, 
      materialSettings, 
      modelName, 
      hiddenMaterials, 
      deletedMaterials, 
      modelMaterialLists,
      selectedMaterial,
      selectedTexture,
      selectedTextureId,
      meshTransforms: meshTransformsRef.current,
      hotspots: hotspots
  });

  // Keep stateRef immediately updated in body
  stateRef.current = { 
      models, 
      transformValues, 
      materialSettings, 
      modelName, 
      hiddenMaterials, 
      deletedMaterials, 
      modelMaterialLists: (modelMaterialLists && Object.keys(modelMaterialLists).length > 0) ? modelMaterialLists : modelMaterialListsRef.current,
      selectedMaterial,
      selectedTexture,
      selectedTextureId,
      meshTransforms: meshTransformsRef.current,
      hotspots: hotspots
  };

  const buildSnapshot = useCallback((override = {}) => {
      const cur = stateRef.current || {};
      const curMS = override.materialSettings || cur.materialSettings || {};
      const curTV = override.transformValues || cur.transformValues || {};
      const curHM = override.hiddenMaterials !== undefined ? override.hiddenMaterials : (cur.hiddenMaterials || []);
      const curDM = override.deletedMaterials !== undefined ? override.deletedMaterials : (cur.deletedMaterials || []);
      const curModels = override.models || cur.models || [];
      const curModelName = override.modelName !== undefined ? override.modelName : (cur.modelName ?? "");
      const curSelMat = override.selectedMaterial !== undefined ? override.selectedMaterial : cur.selectedMaterial;
      const curSelTex = override.selectedTexture !== undefined ? override.selectedTexture : cur.selectedTexture;
      const curSelTexId = override.selectedTextureId !== undefined ? override.selectedTextureId : (curSelTex?.id || cur.selectedTextureId || null);
      const curMatLists = (override.modelMaterialLists && Object.keys(override.modelMaterialLists).length > 0)
          ? override.modelMaterialLists
          : (cur.modelMaterialLists && Object.keys(cur.modelMaterialLists).length > 0
              ? cur.modelMaterialLists
              : (modelMaterialListsRef.current && Object.keys(modelMaterialListsRef.current).length > 0 ? modelMaterialListsRef.current : {}));
      const curMeshTransforms = override.meshTransforms !== undefined ? override.meshTransforms : (cur.meshTransforms || meshTransformsRef.current || {});
      const curHotspots = override.hotspots !== undefined ? override.hotspots : (cur.hotspots || hotspots || []);

      return {
          models: Array.isArray(curModels) ? curModels.map(m => ({ ...m })) : [],
          modelName: curModelName,
          transformValues: {
              position: { ...(curTV?.position || { x: 0, y: 0, z: 0 }) },
              rotation: { ...(curTV?.rotation || { x: 0, y: 0, z: 0 }) },
              scale: { ...(curTV?.scale || { x: 1, y: 1, z: 1 }) }
          },
          materialSettings: {
              ...curMS,
              lightPosition: { ...(curMS?.lightPosition || { x: 10, y: 10, z: 10 }) },
              offset: { ...(curMS?.offset || { x: 0, y: 0 }) },
              maps: { ...(curMS?.maps || {}) }
          },
          hiddenMaterials: Array.from(curHM instanceof Set ? curHM : (curHM || [])),
          deletedMaterials: Array.from(curDM instanceof Set ? curDM : (curDM || [])),
          modelMaterialLists: { ...curMatLists },
          selectedMaterial: curSelMat ? { ...curSelMat } : null,
          selectedTexture: curSelTex ? { ...curSelTex } : null,
          selectedTextureId: curSelTexId,
          meshTransforms: JSON.parse(JSON.stringify(curMeshTransforms || {})),
          hotspots: Array.isArray(curHotspots) ? curHotspots.map(h => ({ ...h })) : []
      };
  }, []);

  const historyDebounceTimerRef = useRef(null);
  const isRestoringHistoryRef = useRef(false);

  const commitHistoryNow = useCallback((snapshot) => {
      if (historyDebounceTimerRef.current) {
          clearTimeout(historyDebounceTimerRef.current);
          historyDebounceTimerRef.current = null;
      }
      const finalState = snapshot || buildSnapshot();
      pushHistory(finalState);
  }, [pushHistory, buildSnapshot]);

  const commitHistoryDebounced = useCallback((snapshot, delay = 400) => {
      if (historyDebounceTimerRef.current) {
          clearTimeout(historyDebounceTimerRef.current);
      }
      historyDebounceTimerRef.current = setTimeout(() => {
          const finalState = snapshot || buildSnapshot();
          pushHistory(finalState);
          historyDebounceTimerRef.current = null;
      }, delay);
  }, [pushHistory, buildSnapshot]);

  const applyHistoryState = useCallback((targetState) => {
      if (!targetState) return;

      isRestoringHistoryRef.current = true;

      if (historyDebounceTimerRef.current) {
          clearTimeout(historyDebounceTimerRef.current);
          historyDebounceTimerRef.current = null;
      }

      if (targetState.models !== undefined) {
          const isCurrentModelPresent = models.length > 0;
          const isTargetEmpty = targetState.models.length === 0;
          if (!isTargetEmpty || !isCurrentModelPresent) {
              setModels(targetState.models);
          }
      }
      if (targetState.modelMaterialLists !== undefined && Object.keys(targetState.modelMaterialLists).length > 0) {
          setModelMaterialLists(targetState.modelMaterialLists);
          modelMaterialListsRef.current = targetState.modelMaterialLists;
      }
      if (targetState.modelName !== undefined && targetState.modelName !== "") {
          setModelName(targetState.modelName);
      }
      if (targetState.transformValues !== undefined) {
          setTransformValues({
              position: { ...(targetState.transformValues.position || { x: 0, y: 0, z: 0 }) },
              rotation: { ...(targetState.transformValues.rotation || { x: 0, y: 0, z: 0 }) },
              scale: { ...(targetState.transformValues.scale || { x: 1, y: 1, z: 1 }) }
          });
      }
      if (targetState.materialSettings !== undefined) {
          setMaterialSettings({
              ...targetState.materialSettings,
              useFactorColor: !!targetState.materialSettings.useFactorColor,
              lastChangedProp: targetState.materialSettings.lastChangedProp || null
          });
      }
      if (targetState.hiddenMaterials !== undefined) {
          setHiddenMaterials(new Set(targetState.hiddenMaterials));
      }
      if (targetState.deletedMaterials !== undefined) {
          setDeletedMaterials(new Set(targetState.deletedMaterials));
      }
      if (targetState.selectedMaterial !== undefined) {
          setSelectedMaterial(targetState.selectedMaterial);
      }
      if (targetState.selectedTexture !== undefined) {
          setSelectedTexture(targetState.selectedTexture);
      }
      if (targetState.meshTransforms !== undefined) {
          const nextTransforms = targetState.meshTransforms ? { ...targetState.meshTransforms } : {};
          meshTransformsRef.current = nextTransforms;
          setMeshTransformsState(nextTransforms);
      }

      if (targetState.hotspots !== undefined) {
          setHotspots(Array.isArray(targetState.hotspots) ? targetState.hotspots : []);
      }

      const tex = targetState.materialSettings?.appliedTexture || targetState.selectedTexture;
      const texId = targetState.selectedTextureId !== undefined ? targetState.selectedTextureId : (tex?.id || null);
      setSelectedTextureId(texId);

      // Keep stateRef immediately updated so rapid sequential undos never use stale data
      stateRef.current = {
          ...stateRef.current,
          models: targetState.models !== undefined ? targetState.models : stateRef.current.models,
          modelName: targetState.modelName !== undefined ? targetState.modelName : stateRef.current.modelName,
          transformValues: targetState.transformValues !== undefined ? targetState.transformValues : stateRef.current.transformValues,
          materialSettings: targetState.materialSettings !== undefined ? targetState.materialSettings : stateRef.current.materialSettings,
          selectedMaterial: targetState.selectedMaterial !== undefined ? targetState.selectedMaterial : stateRef.current.selectedMaterial,
          meshTransforms: targetState.meshTransforms !== undefined ? targetState.meshTransforms : stateRef.current.meshTransforms,
          hiddenMaterials: targetState.hiddenMaterials !== undefined ? targetState.hiddenMaterials : stateRef.current.hiddenMaterials,
          deletedMaterials: targetState.deletedMaterials !== undefined ? targetState.deletedMaterials : stateRef.current.deletedMaterials,
          hotspots: targetState.hotspots !== undefined ? targetState.hotspots : stateRef.current.hotspots
      };

      // Re-trigger visual synchronizations in 3D canvas
      setResetKey(prev => prev + 1);
  }, [models.length, setTransformValues]);

  const handleUndo = useCallback(() => {
      if (historyDebounceTimerRef.current) {
          clearTimeout(historyDebounceTimerRef.current);
          historyDebounceTimerRef.current = null;
          const curState = historyRef.current[indexRef.current];
          if (curState) {
              applyHistoryState(curState);
              return;
          }
      }
      const prevState = undo();
      if (prevState) {
          applyHistoryState(prevState);
      }
  }, [undo, applyHistoryState, historyRef, indexRef]);

  const handleRedo = useCallback(() => {
      if (historyDebounceTimerRef.current) {
          clearTimeout(historyDebounceTimerRef.current);
          historyDebounceTimerRef.current = null;
      }
      const nextState = redo();
      if (nextState) {
          applyHistoryState(nextState);
      }
  }, [redo, applyHistoryState]);

  // --- 3D Hotspots: Focus, Camera Move & Auto Rotate Handlers ---
  const getMeshSurfacePosition = useCallback((meshUuid, clickPoint) => {
    if (clickPoint && typeof clickPoint.x === "number") {
      return [
        parseFloat(clickPoint.x.toFixed(3)),
        parseFloat(clickPoint.y.toFixed(3)),
        parseFloat(clickPoint.z.toFixed(3))
      ];
    }
    if (!meshUuid || !sceneWrapperRef.current) return [0, 1.2, 0];
    let foundMesh = null;
    sceneWrapperRef.current.traverse((child) => {
      if (child.uuid === meshUuid) {
        foundMesh = child;
      }
    });
    if (foundMesh) {
      try {
        const box = new THREE.Box3().setFromObject(foundMesh);
        const center = new THREE.Vector3();
        box.getCenter(center);
        return [
          parseFloat(center.x.toFixed(3)),
          parseFloat(box.max.y.toFixed(3)),
          parseFloat(center.z.toFixed(3))
        ];
      } catch (_) {}
    }
    return [0, 1.2, 0];
  }, []);

  // Smooth spherical camera navigation to show that specific mesh in FRONT VIEW (facing clicked hotspot surface)
  const focusHotspot = useCallback((hotspot) => {
    if (!hotspot) return;
    const camera = cameraInstanceRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    // 1. Locate the specific mesh object in the 3D scene
    let targetMeshObj = null;
    if (sceneWrapperRef.current) {
      sceneWrapperRef.current.traverse((child) => {
        if (
          (hotspot.meshUuid && child.uuid === hotspot.meshUuid) ||
          (hotspot.meshName && child.name === hotspot.meshName)
        ) {
          targetMeshObj = child;
        }
      });
    }

    const hsPos = Array.isArray(hotspot.position)
      ? new THREE.Vector3(...hotspot.position)
      : new THREE.Vector3(0, 1, 0);

    let targetCenter = hsPos.clone();
    let meshRadius = 0.8;

    if (targetMeshObj) {
      // Calculate exact bounding box and center of that mesh
      const box = new THREE.Box3().setFromObject(targetMeshObj);
      if (!box.isEmpty() && isFinite(box.min.x)) {
        const size = new THREE.Vector3();
        box.getCenter(targetCenter);
        box.getSize(size);
        meshRadius = Math.max(0.25, size.length() / 2);
      }
    }

    // 2. Compute camera distance to fit the full mesh in view based on FOV and aspect ratio
    const fov = camera.fov || 45;
    const canvasEl = glInstanceRef.current?.domElement;
    const aspect = (canvasEl && canvasEl.clientHeight > 0)
      ? (canvasEl.clientWidth / canvasEl.clientHeight)
      : (camera.aspect || 1.6);

    const vFOVRad = THREE.MathUtils.degToRad(fov) / 2;
    const hFOVRad = Math.atan(Math.tan(vFOVRad) * aspect);

    // Fit both vertical and horizontal extents of the mesh
    const distV = meshRadius / Math.sin(vFOVRad);
    const distH = meshRadius / Math.sin(hFOVRad);
    const fitDistance = Math.max(distV, distH);

    // Front view framing distance: 28% margin padding around the mesh for a complete, unclipped view
    const framingDistance = Math.max(1.15, fitDistance * 1.28);

    // 3. Compute FRONT VIEW vector directly facing the clicked hotspot surface:
    let frontDir = new THREE.Vector3();

    if (hotspot.normal && Array.isArray(hotspot.normal) && (Math.abs(hotspot.normal[0]) > 0.001 || Math.abs(hotspot.normal[1]) > 0.001 || Math.abs(hotspot.normal[2]) > 0.001)) {
      // 1st priority: Exact surface normal recorded when mesh point was clicked
      frontDir.set(hotspot.normal[0], hotspot.normal[1], hotspot.normal[2]).normalize();
    } else {
      // 2nd priority: Outward vector from mesh center to the hotspot surface position
      frontDir.subVectors(hsPos, targetCenter);
      if (frontDir.lengthSq() > 0.0001) {
        frontDir.normalize();
      } else {
        // Fallback: front perspective facing +Z
        frontDir.set(0, 0.2, 1).normalize();
      }
    }

    // Stable elevation adjustment for top/bottom surfaces
    if (frontDir.y > 0.82) {
      // Top face: direct front-top elevated view facing the top surface
      const fallbackZ = Math.abs(frontDir.z) > 0.1 ? frontDir.z : 0.45;
      frontDir.set(frontDir.x * 0.4, 0.85, fallbackZ).normalize();
    } else if (frontDir.y < -0.82) {
      // Bottom face: direct front-bottom view
      const fallbackZ = Math.abs(frontDir.z) > 0.1 ? frontDir.z : 0.45;
      frontDir.set(frontDir.x * 0.4, -0.85, fallbackZ).normalize();
    } else {
      // Side faces: direct front view looking at the surface with subtle natural elevation (+0.1)
      frontDir.y = Math.max(-0.4, Math.min(0.5, frontDir.y + 0.1));
      frontDir.normalize();
    }

    // Look target blends mesh center and hotspot position for balanced framing
    const lookTarget = targetCenter.clone().lerp(hsPos, 0.4);
    const endCamPos = lookTarget.clone().add(frontDir.multiplyScalar(framingDistance));

    const startCamPos = camera.position.clone();
    const startTarget = controls.target.clone();
    const startTime = performance.now();
    const duration = 540; // ms: buttery smooth orbital sweep to direct front view

    if (cameraAnimFrameRef.current) {
      cancelAnimationFrame(cameraAnimFrameRef.current);
      cameraAnimFrameRef.current = null;
    }

    // Compute relative vectors from target to camera:
    const vStart = new THREE.Vector3().subVectors(startCamPos, startTarget);
    const vEnd = new THREE.Vector3().subVectors(endCamPos, lookTarget);

    const distStart = Math.max(0.1, vStart.length());
    const distEnd = Math.max(0.1, vEnd.length());

    const dirStart = vStart.clone().normalize();
    const dirEnd = vEnd.clone().normalize();

    // Spherical geodesic arc (great circle) between start and end directions:
    const dot = Math.max(-1, Math.min(1, dirStart.dot(dirEnd)));
    const angle = Math.acos(dot);
    let rotationAxis = new THREE.Vector3();

    if (dot < -0.9999) {
      // Opposite directions: arc over the top (+Y)
      rotationAxis.set(0, 1, 0).cross(dirStart);
      if (rotationAxis.lengthSq() < 0.001) rotationAxis.set(1, 0, 0).cross(dirStart);
      rotationAxis.normalize();
    } else if (dot > 0.9999) {
      rotationAxis.set(0, 1, 0);
    } else {
      rotationAxis.crossVectors(dirStart, dirEnd).normalize();
    }

    // Temporarily pause OrbitControls interaction so there is zero jitter/fighting
    const wasControlsEnabled = controls.enabled;
    controls.enabled = false;

    // Mark that we are animating to a hotspot — prevents pointerMissed from clearing the active state
    isHotspotFocusingRef.current = true;

    const animateFocus = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Smooth cubic ease-out
      const ease = 1 - Math.pow(1 - progress, 3);

      // Current direction rotated around spherical axis:
      const curDir = dirStart.clone().applyAxisAngle(rotationAxis, angle * ease).normalize();

      // Smooth distance interpolation:
      const curDist = THREE.MathUtils.lerp(distStart, distEnd, ease);

      // Smooth target interpolation:
      const curTarget = new THREE.Vector3().lerpVectors(startTarget, lookTarget, ease);

      // Position camera along orbital sphere — never cuts through interior of model!
      camera.position.copy(curTarget).addScaledVector(curDir, curDist);
      controls.target.copy(curTarget);
      camera.lookAt(curTarget);

      if (progress < 1) {
        cameraAnimFrameRef.current = requestAnimationFrame(animateFocus);
      } else {
        cameraAnimFrameRef.current = null;
        camera.position.copy(endCamPos);
        controls.target.copy(lookTarget);
        camera.lookAt(lookTarget);
        controls.enabled = wasControlsEnabled;
        controls.update();
        if (typeof controls.saveState === 'function') {
          controls.saveState();
        }
        setTargetPosition({
          x: parseFloat(lookTarget.x.toFixed(2)),
          y: parseFloat(lookTarget.y.toFixed(2)),
          z: parseFloat(lookTarget.z.toFixed(2))
        });
        // Animation complete — re-enable the pointerMissed guard after a brief settle period
        setTimeout(() => {
          isHotspotFocusingRef.current = false;
        }, 120);
      }
    };

    cameraAnimFrameRef.current = requestAnimationFrame(animateFocus);
  }, []);

  const handleHotspotClick = useCallback((hotspot) => {
    if (!hotspot) return;

    // Stamp time so pointerMissed won't clear the state immediately after this click
    lastHotspotClickTimeRef.current = Date.now();

    const hsId = hotspot.id;

    // Toggle off if clicking the already active hotspot
    if (String(activeHotspotId || '') === String(hsId || '')) {
      setActiveHotspotId(null);
      return;
    }

    // Immediately set active hotspot
    setActiveHotspotId(hsId);
    // Switch right panel to hotspot mode to show this active hotspot in list
    setRightPanelMode('hotspot');

    // Smoothly focus camera onto the hotspot's surface position in front view
    focusHotspot(hotspot);
  }, [activeHotspotId, focusHotspot]);

  const handleOpenAddHotspot = useCallback((mesh = null, directOpen = false) => {
    setRightPanelMode('hotspot');
    const targetMesh = mesh || selectedMaterial;
    if (directOpen && targetMesh && targetMesh.isMesh && targetMesh.clickPoint) {
      setEditingHotspot(null);
      setShowHotspotModal(true);
      return;
    }
    // Enter interactive placement mode: ready for user to click anywhere on the 3D model
    setIsPlacingHotspot(true);
    isPlacingHotspotRef.current = true;
    toast.info("Click anywhere on the 3D model to place a hotspot pin");
  }, [selectedMaterial, toast]);

  const handleSaveHotspot = useCallback(({ label, description, color }) => {
    const targetMesh = selectedMaterial;

    const clickNormalArr = targetMesh?.clickNormal
      ? [parseFloat(targetMesh.clickNormal.x.toFixed(4)), parseFloat(targetMesh.clickNormal.y.toFixed(4)), parseFloat(targetMesh.clickNormal.z.toFixed(4))]
      : null;

    if (editingHotspot) {
      // Editing an existing hotspot
      const existingIndex = hotspots.findIndex(h => h.id === editingHotspot.id);
      if (existingIndex !== -1) {
        const existing = hotspots[existingIndex];
        const newPos = targetMesh?.clickPoint 
          ? getMeshSurfacePosition(targetMesh.meshUuid || targetMesh.uuid, targetMesh.clickPoint)
          : existing.position;

        const updatedHs = {
          ...existing,
          label,
          description,
          color: color || "#5d5efc",
          position: newPos,
          normal: clickNormalArr || existing.normal || null,
          meshUuid: targetMesh?.meshUuid || targetMesh?.uuid || existing.meshUuid,
          meshName: targetMesh?.name || targetMesh?.meshName || existing.meshName
        };

        const nextHotspots = [...hotspots];
        nextHotspots[existingIndex] = updatedHs;
        setHotspots(nextHotspots);
        commitHistoryNow(buildSnapshot({ hotspots: nextHotspots }));
        toast.success(`Hotspot "${updatedHs.label}" updated`);

        setTimeout(() => {
          handleHotspotClick(updatedHs);
        }, 50);
      }
    } else {
      // Add new hotspot at pointed surface location (multiple hotspots allowed on any mesh!)
      const pos = getMeshSurfacePosition(targetMesh?.meshUuid || targetMesh?.uuid, targetMesh?.clickPoint);
      const newHs = {
        id: `hs_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        label,
        description,
        color: color || "#5d5efc",
        position: pos,
        normal: clickNormalArr,
        meshUuid: targetMesh?.meshUuid || targetMesh?.uuid || "",
        meshName: targetMesh?.name || targetMesh?.meshName || "Mesh",
        createdAt: Date.now()
      };
      const nextHotspots = [...hotspots, newHs];
      setHotspots(nextHotspots);
      commitHistoryNow(buildSnapshot({ hotspots: nextHotspots }));
      toast.success(`Hotspot "${newHs.label}" added to "${newHs.meshName}"`);

      setTimeout(() => {
        handleHotspotClick(newHs);
      }, 50);
    }
    setShowHotspotModal(false);
    setEditingHotspot(null);
  }, [editingHotspot, hotspots, selectedMaterial, getMeshSurfacePosition, commitHistoryNow, buildSnapshot, toast, handleHotspotClick]);

  const handleDeleteHotspot = useCallback((hotspotId) => {
    const nextHotspots = hotspots.filter(h => h.id !== hotspotId);
    setHotspots(nextHotspots);
    if (activeHotspotId === hotspotId) {
      setActiveHotspotId(null);
    }
    commitHistoryNow(buildSnapshot({ hotspots: nextHotspots }));
    toast.success("Hotspot deleted");
  }, [hotspots, activeHotspotId, commitHistoryNow, buildSnapshot, toast]);

  // --- History Management ---
  // --- Initialization & Server Sync ---
  useEffect(() => {
    const initializeEditor = async () => {
      setIsSyncing(true);
      try {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) return;
        const user = JSON.parse(storedUser);
        const rawBackendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
        const backendUrl = rawBackendUrl.trim().replace(/\/+$/, '');

        // 1. If we have a specific ID in the URL, load THAT model
        if (urlModelId) {
          console.log("Loading specific model from URL ID:", urlModelId);
          startModelLoading({
            id: urlModelId,
            name: "Loading 3D Model...",
            type: "glb"
          });
          try {
            const res = await axios.get(`${backendUrl}/api/3d-models/get-model/${urlModelId}`);
            if (res.data) {
              const modelData = res.data.model || res.data;
              const fullUrl = resolveUploadsPath(modelData.url);
              const loadedHotspots = Array.isArray(modelData.hotspots) ? modelData.hotspots : [];

              const newModel = {
                id: urlModelId,
                modelId: modelData.modelId || urlModelId,
                url: fullUrl,
                file: null,
                type: modelData.type || (['step', 'stp', 'iges', 'igs', 'obj', 'fbx', 'stl', 'low', 'lwo', '3ds'].includes((fullUrl || '').split('?')[0].split('.').pop().toLowerCase()) ? (fullUrl || '').split('?')[0].split('.').pop().toLowerCase() : 'glb'),
                name: (modelData.name || "Model").replace(/\.[^/.]+$/, ""),
                fileName: modelData.fileName,
                displayName: modelData.displayName,
                hotspots: loadedHotspots
              };
              setModels([newModel]);
              setModelUrl(fullUrl);
              setModelType(newModel.type);
              setModelName(newModel.name);
              setSelectedMaterial({ name: newModel.name, parentGroup: newModel.name });
              setIsSidebarCollapsed(false);
              setModelStats({ fileSize: modelData.size || "0 MB" });
              setHotspots(loadedHotspots);
              
              setThreedState(prev => ({
                ...prev,
                models: [newModel],
                modelUrl: fullUrl,
                modelName: newModel.name,
                hotspots: loadedHotspots
              }));

              resetHistory({
                ...stateRef.current,
                models: [newModel],
                modelName: newModel.name,
                selectedMaterial: { name: newModel.name, parentGroup: newModel.name },
                hotspots: loadedHotspots
              });
              startMountingBridgeTicker(loadingProgressRef.current);
              return; // End here for ID-based load
            }
          } catch (err) {
            console.error("Specified model not found, redirecting to 404...", err);
            clearAllLoadingTimers();
            setManualLoading(false);
            loadingProgressRef.current = 0;
            setLoadingProgress(0);
            setLoadingText("");
            navigate('/not-found', { replace: true });
          }
        }

        // 2. Check for temp model passed from InteractionPanel
        const tempThreedEditModelStr = localStorage.getItem('tempThreedEditModel');
        if (tempThreedEditModelStr) {
          try {
            const parsed = JSON.parse(tempThreedEditModelStr);
            const tempId = parsed.id ? String(parsed.id) : Date.now().toString();
            startModelLoading({
              id: tempId,
              name: parsed.name || "Loading 3D Model...",
              type: parsed.type || "glb"
            });
            const fullUrl = parsed.url.startsWith('http') || parsed.url.startsWith('blob:') || parsed.url.startsWith('data:') 
              ? parsed.url 
              : `${backendUrl}${parsed.url}`;
            const newModel = {
              id: tempId,
              modelId: parsed.modelId || null,
              url: fullUrl,
              file: null,
              type: parsed.type || (['step', 'stp', 'iges', 'igs', 'obj', 'fbx', 'stl', 'low', 'lwo', '3ds'].includes((fullUrl || '').split('?')[0].split('.').pop().toLowerCase()) ? (fullUrl || '').split('?')[0].split('.').pop().toLowerCase() : 'glb'),
              name: parsed.name.replace(/\.[^/.]+$/, "")
            };
            setModels([newModel]);
            setModelUrl(fullUrl);
            setModelType(newModel.type);
            setModelName(newModel.name);
            setSelectedMaterial({ name: newModel.name, parentGroup: newModel.name });
            setIsSidebarCollapsed(false);
            const loadedHotspots = Array.isArray(parsed.hotspots) ? parsed.hotspots : [];
            setHotspots(loadedHotspots);
            setThreedState(prev => ({
              ...prev,
              models: [newModel],
              modelUrl: fullUrl,
              modelName: newModel.name,
              hotspots: loadedHotspots
            }));
            resetHistory({
              ...stateRef.current,
              models: [newModel],
              modelName: newModel.name,
              selectedMaterial: { name: newModel.name, parentGroup: newModel.name },
              hotspots: loadedHotspots
            });
            localStorage.removeItem('tempThreedEditModel');
            startMountingBridgeTicker(loadingProgressRef.current);
            return; // End here for temp model load
          } catch(e) {
            console.error("Failed to parse tempThreedEditModel", e);
            clearAllLoadingTimers();
            setManualLoading(false);
            loadingProgressRef.current = 0;
            setLoadingProgress(0);
            setLoadingText("");
            localStorage.removeItem('tempThreedEditModel');
          }
        }

        // 3. If NO ID in URL, we ALWAYS ensure an empty base as requested by the user.
        // This overrides any previous session state in this session.
        setModels([]);
        setModelUrl(null);
        setModelName("");
        setIsSidebarCollapsed(true);
        setSelectedMaterial(null);
        setHiddenMaterials(new Set());
        setDeletedMaterials(new Set());
        setHotspots([]);
        setActiveHotspotId(null);
        setEditingHotspot(null);
        setShowHotspotModal(false);
        setIsPlacingHotspot(false);
        isPlacingHotspotRef.current = false;
        setRightPanelMode('edit');
        
        // Also update the global context state to ensure it doesn't "re-appear"
        setThreedState(prev => ({
            ...prev,
            models: [],
            modelUrl: null,
            modelName: "",
            hotspots: [],
            materialSettings: {
                alpha: 100, metallic: 0, roughness: 50, normal: 100, bump: 100, scale: 50, rotation: 0,
                specular: 50, reflection: 50, shadow: 50, softness: 50, ao: 100, environment: 'studio',
                worldOpacity: 0, worldBlur: 0,
                color: '#ffffff', useFactorColor: false, autoUnwrap: false, envRotation: 0, offset: { x: 0, y: 0 },
                lightPosition: { x: 10, y: 10, z: 10 }
            }
        }));

      } catch (globalError) {
        console.error("Global initialize error:", globalError);
      } finally {
        setIsSyncing(false);
      }
    };

    initializeEditor();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lastSavedRef = useRef({
    historyIndex: 0,
    hasLocalFiles: false
  });

  useEffect(() => {
    if (!setCanSave) return undefined;

    setCanSave(models.length > 0);

    return () => {
      setCanSave(true);
    };
  }, [models.length, setCanSave]);

  const handleSave = useCallback(async () => {
    const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB per chunk

    try {
      if (models.length === 0) {
        return;
      }

      setIsSaving(true);
      const storedUser = localStorage.getItem('user');
      if (!storedUser) {
        console.error("User not found in localStorage");
        return;
      }
      
      const user = JSON.parse(storedUser);
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

      const nextModels = [...models];

      // Note: All textures are directly embedded in the exported binary GLB via GLTFExporter (embedImages: true),
      // so separate texture uploads to 3D_Models/Textures are not needed.




      // 1. Export Textured GLB and PNG for Gallery Thumbnail
      let hasExported = false;
      const gl = glInstanceRef.current;
      const camera = cameraInstanceRef.current;
      const modelGroup = sceneWrapperRef.current;
      
      if (gl && camera && nextModels.length > 0) {
          try {
              // ─── CLEAN & SAFE GLB EXPORT ──────────────────────────────────
              // Export the clean model scene directly, avoiding redundant wrapper groups
              // and preserving author's original coordinates without viewport normalization artifacts.
              const resolveLiveScene = (modelId) => {
                  const raw = modelRefs.current.get(modelId) || (modelId === nextModels[0]?.id ? modelRef.current : null);
                  if (raw && typeof raw.clone === 'function' && raw.isObject3D) return raw;
                  if (raw?.scene && typeof raw.scene.clone === 'function' && raw.scene.isObject3D) return raw.scene;
                  // Fallback: search inside sceneWrapperRef.current for the inner scene primitive
                  if (sceneWrapperRef.current && sceneWrapperRef.current.children.length > 0) {
                      for (const child of sceneWrapperRef.current.children) {
                          if (child.children && child.children.length > 0) {
                              const inner = child.children[0];
                              if (inner && typeof inner.clone === 'function' && inner.isObject3D) return inner;
                          }
                          if (child && typeof child.clone === 'function' && child.isObject3D) return child;
                      }
                  }
                  return sceneWrapperRef.current;
              };

              let exportScene;
              const liveScene = resolveLiveScene(nextModels[0]?.id);

              const hasUserTransform = transformValues && (
                  (transformValues.position && (Math.abs(transformValues.position.x) > 1e-4 || Math.abs(transformValues.position.y) > 1e-4 || Math.abs(transformValues.position.z) > 1e-4)) ||
                  (transformValues.rotation && (Math.abs(transformValues.rotation.x) > 1e-4 || Math.abs(transformValues.rotation.y) > 1e-4 || Math.abs(transformValues.rotation.z) > 1e-4)) ||
                  (transformValues.scale && (Math.abs(transformValues.scale.x - 1) > 1e-4 || Math.abs(transformValues.scale.y - 1) > 1e-4 || Math.abs(transformValues.scale.z - 1) > 1e-4))
              );

              if (nextModels.length === 1 && liveScene) {
                  exportScene = SkeletonUtils.clone(liveScene);
                  // Apply user-level transforms ONLY if the user explicitly moved/rotated/scaled the model in editor
                  if (hasUserTransform) {
                      exportScene.position.x += (transformValues.position?.x || 0);
                      exportScene.position.y += (transformValues.position?.y || 0);
                      exportScene.position.z += (transformValues.position?.z || 0);
                      exportScene.rotation.x += (transformValues.rotation?.x || 0);
                      exportScene.rotation.y += (transformValues.rotation?.y || 0);
                      exportScene.rotation.z += (transformValues.rotation?.z || 0);
                      if (transformValues.scale) {
                          exportScene.scale.x *= (transformValues.scale.x || 1);
                          exportScene.scale.y *= (transformValues.scale.y || 1);
                          exportScene.scale.z *= (transformValues.scale.z || 1);
                      }
                  }
              } else {
                  exportScene = new THREE.Scene();
                  nextModels.forEach((m) => {
                      const s = resolveLiveScene(m.id);
                      if (s) {
                          exportScene.add(SkeletonUtils.clone(s));
                      }
                  });
              }

              // 1. Strip helper tools, gizmos, cameras, lights, and corrupted meshes
              const toRemove = [];
              exportScene.traverse((obj) => {
                  if (
                      obj.isTransformControls ||
                      obj.isTransformControlsGizmo ||
                      obj.isTransformControlsPlane ||
                      obj.isCamera ||
                      obj.isLight ||
                      (obj.type && obj.type.toLowerCase().startsWith('transformcontrols')) ||
                      (obj.name && obj.name.toLowerCase().includes('transformcontrols')) ||
                      (obj.name && obj.name.toLowerCase().includes('gizmo'))
                  ) {
                      toRemove.push(obj);
                      return;
                  }

                  // Strip empty/corrupt meshes with no position attribute
                  if (obj.isMesh || obj.isLine || obj.isPoints) {
                      if (!obj.geometry || !obj.geometry.attributes || !obj.geometry.attributes.position || !obj.geometry.attributes.position.array || obj.geometry.attributes.position.count === 0) {
                          toRemove.push(obj);
                          return;
                      }
                  }

                  // Strip deleted meshes physically before exporting to GLB!
                  if (deletedMaterials && deletedMaterials.size > 0 && (obj.isMesh || obj.isLine || obj.isPoints)) {
                      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
                      const isDeleted = deletedMaterials.has(obj.uuid) ||
                                        mats.some(m => m?.name && deletedMaterials.has(m.name));
                      if (isDeleted) {
                          toRemove.push(obj);
                          return;
                      }
                  }

                  // Sanitize SkinnedMeshes to prevent skeleton.bones undefined crash
                  if (obj.isSkinnedMesh) {
                      if (!obj.skeleton || !Array.isArray(obj.skeleton.bones) || obj.skeleton.bones.length === 0) {
                          obj.isSkinnedMesh = false;
                          delete obj.skeleton;
                          delete obj.bindMatrix;
                          delete obj.bindMatrixInverse;
                      }
                  }

                  // Sanitize materials for export
                  if (obj.isMesh && obj.material) {
                      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
                      mats.forEach((mat) => {
                          if (!mat) return;
                          const isTrans = (mat.opacity < 0.99) || !!mat.alphaMap;
                          mat.transparent = isTrans;
                          mat.depthWrite = !isTrans;
                          mat.alphaTest = 0;
                          // Detach envMap so environment map reflections are not serialized into the GLB
                          if (mat.envMap) {
                              mat.envMap = null;
                          }
                      });
                  }
              });

              toRemove.forEach((obj) => { if (obj.parent) obj.parent.remove(obj); });

              // Restore all hierarchy nodes (bones and animated parent nodes) to their pristine rest/bind pose before export
              exportScene.traverse((child) => {
                  if (child.userData?.__bindPos && child.userData?.__bindQuat && child.userData?.__bindScale) {
                      const p = child.userData.__bindPos;
                      const q = child.userData.__bindQuat;
                      const s = child.userData.__bindScale;
                      child.position.set(p[0], p[1], p[2]);
                      if (Math.hypot(q[0], q[1], q[2], q[3]) > 0.0001) {
                          child.quaternion.set(q[0], q[1], q[2], q[3]).normalize();
                      } else {
                          child.quaternion.identity();
                      }
                      child.scale.set(s[0], s[1], s[2]);
                      child.updateMatrix();
                  } else if (child.isBone) {
                      // Fallback for bones with legacy transform data
                      if (child.userData?.__bindPos) {
                          const p = child.userData.__bindPos;
                          child.position.set(p[0], p[1], p[2]);
                      }
                      if (child.userData?.__bindQuat) {
                          const q = child.userData.__bindQuat;
                          if (Math.hypot(q[0], q[1], q[2], q[3]) > 0.0001) {
                              child.quaternion.set(q[0], q[1], q[2], q[3]).normalize();
                          }
                      }
                      if (child.userData?.__bindScale) {
                          const s = child.userData.__bindScale;
                          child.scale.set(s[0], s[1], s[2]);
                      }
                      if (!child.userData?.__bindQuat && child.userData?.__bindTransform?.quaternion) {
                          const q = child.userData.__bindTransform.quaternion;
                          const qx = q.x !== undefined ? q.x : q._x;
                          const qy = q.y !== undefined ? q.y : q._y;
                          const qz = q.z !== undefined ? q.z : q._z;
                          const qw = q.w !== undefined ? q.w : (q._w !== undefined ? q._w : 1);
                          if (qx !== undefined && !isNaN(qx) && Math.hypot(qx, qy, qz, qw) > 0.0001) {
                              child.quaternion.set(qx, qy, qz, qw).normalize();
                          }
                      }
                      child.updateMatrix();
                  }
              });

              // Clean editor-specific metadata from all nodes in exportScene
              exportScene.traverse((obj) => {
                  if (obj.userData) {
                      delete obj.userData.normalization;
                      delete obj.userData.originalTransform;
                  }
              });

              try { exportScene.updateMatrixWorld(true); } catch (_) {}

              // 2. Collect and validate AnimationClips
              const exportAnimations = [];
              const seenNames = new Set();
              const collectClip = (c) => {
                  if (!c || !Array.isArray(c.tracks) || c.tracks.length === 0) return;
                  const key = c.name || c.uuid;
                  if (seenNames.has(key)) return;
                  
                  // Validate tracks have valid times and values
                  const validTracks = c.tracks.filter(t => t && t.name && t.times && t.values && t.times.length > 0 && t.values.length > 0);
                  if (validTracks.length === 0) return;

                  seenNames.add(key);
                  const cleanClip = c.clone();
                  const resolvableTracks = [];

                  for (const track of validTracks) {
                      const clonedTrack = track.clone();
                      const parts = clonedTrack.name.split('.');
                      const propertyName = parts.pop();
                      const targetPath = parts.join('.');
                      
                      let targetNode = THREE.PropertyBinding.findNode(exportScene, targetPath);
                      if (!targetNode && targetPath.includes('/')) {
                          const baseNodeName = targetPath.split('/').pop();
                          const found = exportScene.getObjectByName(baseNodeName);
                          if (found) {
                              clonedTrack.name = `${baseNodeName}.${propertyName}`;
                              targetNode = found;
                          }
                      } else if (!targetNode) {
                          const found = exportScene.getObjectByName(targetPath);
                          if (found) {
                              targetNode = found;
                          }
                      }
                      
                      // Only keep tracks where the target node actually exists in exportScene!
                      // If a track points to a nonexistent node, GLTFExporter aborts and drops the ENTIRE clip.
                      if (targetNode) {
                          resolvableTracks.push(clonedTrack);
                      }
                  }

                  if (resolvableTracks.length > 0) {
                      cleanClip.tracks = resolvableTracks;
                      exportAnimations.push(cleanClip);
                  }
              };

              if (exportScene.animations) exportScene.animations.forEach(collectClip);
              exportScene.traverse(n => { if (n.animations) n.animations.forEach(collectClip); });

              modelRefs.current.forEach((liveScene) => {
                  if (!liveScene) return;
                  if (liveScene.animations) liveScene.animations.forEach(collectClip);
                  if (typeof liveScene.traverse === 'function') {
                      liveScene.traverse(n => { if (n.animations) n.animations.forEach(collectClip); });
                  }
              });

              nextModels.forEach((m) => {
                  if (m?.animations) m.animations.forEach(collectClip);
                  if (m?.scene?.animations) m.scene.animations.forEach(collectClip);
              });

              // 3. Export combined GLB containing all models
              const exporter = new GLTFExporter();
              const exportOptions = {
                binary: true, 
                forceIndices: true, 
                trs: true,            // CRITICAL: Export clean TRS (translation/rotation/scale) per node instead of matrix so animations play correctly without skewing or inversion
                onlyVisible: false,   // CRITICAL: Never omit invisible bones/joints, ensuring skin.joints indices never misalign with vertex skinIndex
                maxTextureSize: 2048,
                embedImages: true,
                animations: (exportAnimations && exportAnimations.length > 0) ? exportAnimations : []
              };

              const glbBuffer = await new Promise((resolve, reject) => {
                  exporter.parse(
                      exportScene, 
                      (result) => resolve(result instanceof ArrayBuffer ? result : new TextEncoder().encode(JSON.stringify(result)).buffer), 
                      (err) => reject(err), 
                      exportOptions
                  );
              });
              
              // If a physical fileName exists (e.g. Interaction Mode), preserve it exactly.
              const originalFileName = nextModels[0]?.fileName;
              const defaultBaseName = (modelName || nextModels[0]?.name || "Scene").replace(/\.[^/.]+$/, "").replace(/\s+/g, '_');
              
              const exportFileName = originalFileName || `${defaultBaseName}.glb`;
              
              // C. Upload GLB using chunked upload to prevent 413 Content Too Large errors over proxies
              const glbBlob = new Blob([glbBuffer]);
              const glbSize = glbBlob.size;
              const totalGlbChunks = Math.ceil(glbSize / CHUNK_SIZE);
              const glbUploadId = Date.now().toString() + Math.random().toString(36).substring(7);
              let glbRes = null;

              for (let chunkIndex = 0; chunkIndex < totalGlbChunks; chunkIndex++) {
                  const start = chunkIndex * CHUNK_SIZE;
                  const end = Math.min(start + CHUNK_SIZE, glbSize);
                  const chunk = glbBlob.slice(start, end);
                  
                  const formData = new FormData();
                  formData.append('uploadId', glbUploadId);
                  formData.append('chunkIndex', chunkIndex);
                  formData.append('totalChunks', totalGlbChunks);
                  formData.append('fileName', exportFileName);
                  formData.append('emailId', user.emailId);
                  if (nextModels[0]?.modelId) {
                      formData.append('modelId', nextModels[0].modelId);
                  }
                  formData.append('chunk', chunk);
                  formData.append('hotspots', JSON.stringify(hotspots || []));

                  const res = await axios.post(`${backendUrl}/api/3d-models/upload-chunk`, formData, {
                      headers: { 'Content-Type': 'multipart/form-data' }
                  });
                  glbRes = res;
              }
              
              if (glbRes && glbRes.data && glbRes.data.url) {
                  const rawUrl = glbRes.data.url;
                  const baseUrl = (rawUrl.startsWith('http://') || rawUrl.startsWith('https://'))
                      ? rawUrl
                      : `${backendUrl}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;
                  const resolvedBaseUrl = resolveUploadsPath(baseUrl);

                  const timestamp = Date.now();
                  const targetGlbUrl = resolvedBaseUrl.includes('?') 
                      ? `${resolvedBaseUrl}&t=${timestamp}` 
                      : `${resolvedBaseUrl}?t=${timestamp}`;

                  // Clear loader cache so the fresh merged model is loaded
                  try {
                      useGLTF.clear(baseUrl);
                      useGLTF.clear(resolvedBaseUrl);
                      useGLTF.clear(targetGlbUrl);
                  } catch (e) {}

                  // Keep UI name clean, but update underlying record info
                  const mergedModelId = `model_${timestamp}`;
                  const savedModelId = glbRes.data.modelId || nextModels[0]?.modelId;
                  const mergedModel = {
                      ...nextModels[0],
                      id: mergedModelId,
                      url: targetGlbUrl,
                      name: nextModels[0]?.displayName || (originalFileName ? originalFileName : `${defaultBaseName}.glb`),
                      displayName: nextModels[0]?.displayName || (originalFileName ? originalFileName : defaultBaseName),
                      fileName: originalFileName,
                      type: 'glb',
                      file: null,
                      modelId: savedModelId,
                      hotspots: hotspots || []
                  };
                  hasExported = true;
                  if (!originalFileName) {
                      setModelName(defaultBaseName); // Keep extension-less for toolbar if it's a new standalone model
                  }
                  setModelUrl(targetGlbUrl);

                  // Merge all models into the single unified model
                  nextModels.splice(0, nextModels.length, mergedModel);

                  // Clear multi-model lists so the unified model takes over
                  setModelMaterialLists({});
                  setModelMaterialDataMap({});
                  setModelStatsMap({});
                  setSelectedMaterial({ name: defaultBaseName, parentGroup: defaultBaseName });
                  setTransformValues({
                      position: { x: 0, y: 0, z: 0 },
                      rotation: { x: 0, y: 0, z: 0 },
                      scale: { x: 1, y: 1, z: 1 }
                  });

                  // Explicitly persist hotspots to database for this model
                  try {
                    await axios.post(`${backendUrl}/api/3d-models/save-hotspots`, {
                      modelId: savedModelId,
                      emailId: user.emailId,
                      hotspots: hotspots || []
                    });
                  } catch (hsErr) {
                    console.warn("Direct hotspots save notice:", hsErr);
                  }

                  // Also persist session state with hotspots to make it reliable across reloads
                  try {
                    await axios.post(`${backendUrl}/api/3d-models/save-session`, {
                      emailId: user.emailId,
                      state: {
                        models: nextModels,
                        hotspots: hotspots || [],
                        transformValues: {
                          position: { x: 0, y: 0, z: 0 },
                          rotation: { x: 0, y: 0, z: 0 },
                          scale: { x: 1, y: 1, z: 1 }
                        },
                        materialSettings,
                        modelName: defaultBaseName,
                        lastSaved: new Date().toISOString()
                      }
                    });
                  } catch (sessErr) {
                    console.warn("Session save notice:", sessErr);
                  }

                  // Broadcast save to InteractionPanel to bust browser cache
                  try {
                    const bc = new BroadcastChannel('threed_model_updates');
                    bc.postMessage({
                      type: 'model-saved',
                      modelId: savedModelId,
                      timestamp: Date.now()
                    });
                    bc.close();
                  } catch (bcErr) {
                    console.warn('BroadcastChannel not supported:', bcErr);
                  }
              }
          } catch (e) {
              console.error("Gallery sync failed:", e);
          }
      }

      if (hasExported) {
        setModels(nextModels);
      }
      
      // Update last saved reference to current state
      lastSavedRef.current = {
        historyIndex: past.length,
        hasLocalFiles: false
      };
      setHasUnsavedChanges(false);
      
      if (triggerSaveSuccess) {
        triggerSaveSuccess({
          isManual: true,
          name: modelName || "3D Model",
          folder: "3D_Modals"
        });
      }

      // If we just got a modelId from the first save, update URL
      const finalModelId = nextModels[0]?.modelId;
      console.log("HandleSave Navigation Check:", { finalModelId, urlModelId });
      
      if (finalModelId && (!urlModelId || urlModelId === "")) {
          console.log("Navigating to new model URL:", finalModelId);
          navigate(`/editor/threed_editor/${finalModelId}`, { replace: true });
      }
    } catch (error) {
      console.error("Error saving 3D models:", error);
      const errorMessage = error.response?.data?.message || error.message || "An unexpected error occurred while saving your model.";
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
      setManualLoading(false);
      setLoadingText("");
    }
  }, [models, modelName, setModelName, setIsSaving, setHasUnsavedChanges, triggerSaveSuccess, toast, materialSettings, transformValues, setTransformValues, past, urlModelId, navigate, hotspots]);

  useEffect(() => {
    if (setSaveHandler) {
      setSaveHandler(() => handleSave);
    }
    return () => {
      if (setSaveHandler) setSaveHandler(null);
    };
  }, [handleSave, setSaveHandler]);

  // Track Unsaved Changes
  useEffect(() => {
      const hasLocalModels = models.some(m => m.file);
      const historyChanged = past.length !== lastSavedRef.current.historyIndex;
      
      setHasUnsavedChanges(hasLocalModels || historyChanged);
  }, [models, past.length, setHasUnsavedChanges]);

  const convertCadToGlbBlob = async (file, ext = 'step') => {
    const isIges = ext === 'iges' || ext === 'igs' || file.name.toLowerCase().endsWith('.iges') || file.name.toLowerCase().endsWith('.igs');
    const fileSizeMB = file.size ? (file.size / (1024 * 1024)) : 0;
    
    setLoadingText(`Reading ${isIges ? 'IGES' : 'STEP'} CAD file (${fileSizeMB > 0 ? fileSizeMB.toFixed(1) + ' MB' : ''})...`);
    setSafeProgress(15);
    await new Promise(r => setTimeout(r, 60));

    const buffer = await file.arrayBuffer();
    
    setLoadingText("Initializing OpenCASCADE WASM...");
    setSafeProgress(25);
    await new Promise(r => setTimeout(r, 60));

    const occt = await initOCCT({
      locateFile: () => '/occt-import-js.wasm'
    });

    // Adaptive deflection for fast tessellation without freezing:
    // 0.001 (the default) causes hundreds of thousands of micro-facets on large CAD models, taking minutes.
    // 0.02 - 0.025 gives crisp surface quality and triangulates in just a few seconds!
    const deflection = fileSizeMB > 10 ? 0.025 : (fileSizeMB > 3 ? 0.018 : 0.01);
    const params = {
      linearUnit: 'millimeter',
      linearDeflectionType: 'bounding_box_ratio',
      linearDeflection: deflection,
      angularDeflection: 0.65
    };

    setLoadingText(`Tessellating ${isIges ? 'IGES' : 'STEP'} geometry with OpenCASCADE...`);
    setSafeProgress(45);
    await new Promise(r => setTimeout(r, 60));

    const fileData = new Uint8Array(buffer);
    let result = null;
    try {
      result = isIges
        ? occt.ReadIgesFile(fileData, params)
        : occt.ReadStepFile(fileData, params);
    } catch (readErr) {
      console.warn("Fast CAD conversion failed:", readErr);
    }

    if (!result || !result.meshes || result.meshes.length === 0) {
      console.warn("Retrying CAD read with default parameters...");
      try {
        result = isIges
          ? occt.ReadIgesFile(fileData, null)
          : occt.ReadStepFile(fileData, null);
      } catch (fallbackErr) {
        console.error("CAD fallback read failed:", fallbackErr);
      }
    }

    if (!result || !result.meshes || result.meshes.length === 0) {
      throw new Error(`No meshes found in ${isIges ? 'IGES' : 'STEP'} file.`);
    }

    setLoadingText(`Processing ${result.meshes.length} geometry components...`);
    setSafeProgress(70);
    await new Promise(r => setTimeout(r, 60));

    const group = new THREE.Group();
    let matIndex = 1;
    // Shared material cache by color to prevent creating thousands of redundant materials
    const materialCache = new Map();

    for (const meshData of result.meshes) {
      const geometry = new THREE.BufferGeometry();
      if (meshData.attributes.position) {
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(meshData.attributes.position.array, 3));
      }
      if (meshData.attributes.normal) {
        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(meshData.attributes.normal.array, 3));
      }
      if (meshData.attributes.uv) {
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(meshData.attributes.uv.array, 2));
      }
      if (meshData.index) {
        const is32Bit = meshData.attributes.position && (meshData.attributes.position.array.length / 3) > 65535;
        geometry.setIndex(is32Bit 
          ? new THREE.Uint32BufferAttribute(meshData.index.array, 1)
          : new THREE.Uint16BufferAttribute(meshData.index.array, 1));
      }
      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();
      if (!meshData.attributes.normal) {
        geometry.computeVertexNormals();
      }

      let colorKey = 'default';
      if (meshData.color) {
        const c = meshData.color;
        colorKey = `${Math.round(c[0] * 255)},${Math.round(c[1] * 255)},${Math.round(c[2] * 255)}`;
      }

      let material = materialCache.get(colorKey);
      if (!material) {
        let color = '#a0a0a0';
        if (meshData.color) {
          const c = meshData.color;
          color = new THREE.Color(c[0], c[1], c[2]);
        }
        material = new THREE.MeshStandardMaterial({
          color,
          roughness: 0.5,
          metalness: 0.1,
          side: THREE.DoubleSide,
          name: meshData.name ? `${meshData.name}_Mat` : `Material_${String(matIndex++).padStart(2, '0')}`
        });
        materialCache.set(colorKey, material);
      }

      const mesh = new THREE.Mesh(geometry, material);
      if (meshData.name) mesh.name = meshData.name;
      group.add(mesh);
    }
    group.updateMatrixWorld(true);

    setLoadingText("Compiling 3D model...");
    setSafeProgress(85);
    await new Promise(r => setTimeout(r, 60));

    const exporter = new GLTFExporter();
    const glbBuffer = await new Promise((resolve, reject) => {
      exporter.parse(
        group,
        (res) => resolve(res instanceof ArrayBuffer ? res : new TextEncoder().encode(JSON.stringify(res)).buffer),
        reject,
        { binary: true, forceIndices: true, embedImages: false, animations: [] }
      );
    });

    setSafeProgress(88);
    return new Blob([glbBuffer], { type: 'model/gltf-binary' });
  };

  const convertStepToGlbBlob = (file) => convertCadToGlbBlob(file, 'step');

  const convertObjToGlbBlob = async (file) => {
    setLoadingText("Parsing OBJ model in browser...");
    setSafeProgress(25);
    const text = await file.text();
    const loader = new OBJLoader();
    const obj = loader.parse(text);
    
    setLoadingText("Generating GLB from OBJ model...");
    setSafeProgress(65);
    const exporter = new GLTFExporter();
    const glbBuffer = await new Promise((resolve, reject) => {
      exporter.parse(
        obj,
        (res) => resolve(res instanceof ArrayBuffer ? res : new TextEncoder().encode(JSON.stringify(res)).buffer),
        reject,
        { binary: true, embedImages: true, animations: [] }
      );
    });
    setSafeProgress(85);
    return new Blob([glbBuffer], { type: 'model/gltf-binary' });
  };

  const checkFbxLegacyVersion = async (file) => {
    if (!file || !file.name || !file.name.toLowerCase().endsWith('.fbx')) return null;
    try {
      const slice = file.slice(0, 64);
      const buffer = await slice.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const text = new TextDecoder().decode(bytes.subarray(0, 18));
      if (text.startsWith('Kaydara FBX Binary')) {
        const view = new DataView(buffer);
        const version = view.getUint32(23, true); // little-endian
        if (version < 7100) {
          return version;
        }
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  const convertFbxToGlbBlob = async (file) => {
    setLoadingText("Parsing FBX model in browser...");
    setSafeProgress(25);
    const buffer = await file.arrayBuffer();

    // Isolated loading manager so texture fetches do not pollute Drei useProgress
    const isolatedManager = new THREE.LoadingManager();
    isolatedManager.onError = (url) => {
      console.warn("[FBX in-browser converter] Sub-resource notice:", url);
    };

    const loader = new FBXLoader(isolatedManager);
    let fbx;
    try {
      fbx = loader.parse(buffer, '');
    } catch (parseErr) {
      console.error("[FBXLoader] Browser parse error:", parseErr);
      throw new Error(`Browser FBX parsing failed: ${parseErr.message}. If this FBX was saved in an older format (FBX 6.x or ASCII), please export as modern binary FBX (2014-2020) or GLB.`);
    }

    setLoadingText("Optimizing FBX geometry and materials...");
    setSafeProgress(55);

    // Helper to safely validate texture images before GLTFExporter processes them
    const isValidTexture = (tex) => {
      if (!tex) return false;
      const img = tex.image;
      if (!img) return false;
      if (img instanceof HTMLImageElement) {
        return img.complete && img.naturalWidth > 0 && img.naturalHeight > 0;
      }
      if ((img.width && img.width > 0) || (img.videoWidth && img.videoWidth > 0)) {
        return true;
      }
      if (img.data && img.data.length > 0 && img.width > 0) {
        return true;
      }
      return false;
    };

    const textureMapKeys = [
      'map', 'normalMap', 'roughnessMap', 'metalnessMap',
      'bumpMap', 'aoMap', 'emissiveMap', 'specularMap',
      'alphaMap', 'displacementMap', 'lightMap', 'envMap'
    ];

    // Sanitize materials, textures, and normals so GLTFExporter doesn't crash on invalid images or missing attributes
    fbx.traverse((child) => {
      if (child.isMesh) {
        // Ensure vertex normals exist
        if (child.geometry && !child.geometry.attributes.normal) {
          try { child.geometry.computeVertexNormals(); } catch (e) {}
        }

        if (child.material) {
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          const sanitizedMats = mats.map((m) => {
            if (!m) return new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.5, metalness: 0.1 });

            // Remove any textures that failed to load or have zero dimensions (prevents canvas drawImage crashes)
            textureMapKeys.forEach((key) => {
              if (m[key] && !isValidTexture(m[key])) {
                m[key] = null;
              }
            });

            // If material is legacy Phong or Lambert, convert to MeshStandardMaterial with DoubleSide
            if (!m.isMeshStandardMaterial && !m.isMeshPhysicalMaterial) {
              return new THREE.MeshStandardMaterial({
                name: m.name || 'FBX_Material',
                color: m.color ? m.color.clone() : new THREE.Color(0xffffff),
                map: isValidTexture(m.map) ? m.map : null,
                normalMap: isValidTexture(m.normalMap) ? m.normalMap : null,
                roughness: m.shininess ? Math.max(0.1, Math.min(1.0, 1.0 - (m.shininess / 100))) : 0.6,
                metalness: 0.1,
                transparent: m.transparent || (m.opacity < 1),
                opacity: typeof m.opacity === 'number' ? m.opacity : 1,
                side: THREE.DoubleSide
              });
            } else {
              m.side = THREE.DoubleSide;
              return m;
            }
          });

          child.material = Array.isArray(child.material) ? sanitizedMats : sanitizedMats[0];
        }
      }
    });

    setLoadingText("Generating GLB from FBX model...");
    setSafeProgress(75);

    const fbxAnimations = (fbx.animations || []).filter(a => a && Array.isArray(a.tracks) && a.tracks.length > 0);
    const exporter = new GLTFExporter();

    const runGltfExport = (options) => {
      return new Promise((resolve, reject) => {
        exporter.parse(
          fbx,
          (res) => resolve(res instanceof ArrayBuffer ? res : new TextEncoder().encode(JSON.stringify(res)).buffer),
          reject,
          { animations: [], ...(options || {}) }
        );
      });
    };

    let glbBuffer;
    try {
      // Tier 1: Export with animations & textures
      glbBuffer = await runGltfExport({
        binary: true,
        embedImages: true,
        animations: fbxAnimations.length > 0 ? fbxAnimations : []
      });
    } catch (animErr) {
      console.warn("[FBX Exporter] Tier 1 export notice, trying without animations:", animErr.message);
      try {
        // Tier 2: Retry without animations in case animation tracks had invalid bone references
        glbBuffer = await runGltfExport({
          binary: true,
          embedImages: true,
          animations: []
        });
      } catch (texErr) {
        console.warn("[FBX Exporter] Tier 2 export notice, trying without external texture embedding:", texErr.message);
        // Tier 3: Retry without embedding images in case texture formats were incompatible
        glbBuffer = await runGltfExport({
          binary: true,
          embedImages: false,
          animations: []
        });
      }
    }

    setLoadingText("FBX converted to GLB successfully!");
    setSafeProgress(88);
    return new Blob([glbBuffer], { type: 'model/gltf-binary' });
  };

  const convertStlToGlbBlob = async (file) => {
    setLoadingText("Parsing STL model in browser...");
    setSafeProgress(25);
    const buffer = await file.arrayBuffer();
    const loader = new STLLoader();
    const geom = loader.parse(buffer);
    const mat = new THREE.MeshStandardMaterial({ color: '#a0a0a0', roughness: 0.5, metalness: 0.1, name: 'STL_Material' });
    const mesh = new THREE.Mesh(geom, mat);
    
    setLoadingText("Generating GLB from STL model...");
    setSafeProgress(65);
    const exporter = new GLTFExporter();
    const glbBuffer = await new Promise((resolve, reject) => {
      exporter.parse(
        mesh,
        (res) => resolve(res instanceof ArrayBuffer ? res : new TextEncoder().encode(JSON.stringify(res)).buffer),
        reject,
        { binary: true, animations: [] }
      );
    });
    setSafeProgress(85);
    return new Blob([glbBuffer], { type: 'model/gltf-binary' });
  };

  const convertLwoToGlbBlob = async (file) => {
    setLoadingText("Parsing LWO model in browser...");
    setSafeProgress(25);
    const buffer = await file.arrayBuffer();
    const loader = new LWOLoader();
    const lwoData = loader.parse(buffer, '', file.name.split('.')[0]);
    const group = new THREE.Group();
    if (lwoData?.meshes && Array.isArray(lwoData.meshes)) {
      lwoData.meshes.forEach(m => group.add(m));
    }
    group.updateMatrixWorld(true);

    setLoadingText("Generating GLB from LWO model...");
    setSafeProgress(65);
    const exporter = new GLTFExporter();
    const glbBuffer = await new Promise((resolve, reject) => {
      exporter.parse(
        group,
        (res) => resolve(res instanceof ArrayBuffer ? res : new TextEncoder().encode(JSON.stringify(res)).buffer),
        reject,
        { binary: true, animations: [] }
      );
    });
    setSafeProgress(85);
    return new Blob([glbBuffer], { type: 'model/gltf-binary' });
  };

  const convert3dsToGlbBlob = async (file) => {
    setLoadingText("Parsing 3DS model in browser...");
    setSafeProgress(25);
    const buffer = await file.arrayBuffer();
    const loader = new TDSLoader();
    const group = loader.parse(buffer, '');
    group.updateMatrixWorld(true);

    setLoadingText("Generating GLB from 3DS model...");
    setSafeProgress(65);
    const exporter = new GLTFExporter();
    const glbBuffer = await new Promise((resolve, reject) => {
      exporter.parse(
        group,
        (res) => resolve(res instanceof ArrayBuffer ? res : new TextEncoder().encode(JSON.stringify(res)).buffer),
        reject,
        { binary: true, animations: [] }
      );
    });
    setSafeProgress(85);
    return new Blob([glbBuffer], { type: 'model/gltf-binary' });
  };

  const convertModelViaBackend = async (file, ext, baseName) => {
    const rawBackendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    const backendUrl = rawBackendUrl.trim().replace(/\/+$/, '');
    const storedUser = localStorage.getItem('user');
    const user = storedUser ? JSON.parse(storedUser) : { emailId: 'guest_user' };
    const emailId = user.emailId || 'guest_user';

    const isCad = ['step', 'stp', 'iges', 'igs', 'stl'].includes(ext);
    const engineName = isCad ? "OpenCASCADE" : "Assimp";

    // Heavy files (> 15MB): Use chunked upload to prevent socket timeouts & proxy drops
    const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
    if (file.size > 15 * 1024 * 1024) {
      const fileSize = file.size;
      const totalChunks = Math.ceil(fileSize / CHUNK_SIZE);
      const uploadId = Date.now().toString() + Math.random().toString(36).substring(7);
      let lastRes = null;

      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, fileSize);
        const chunk = file.slice(start, end);

        const uploadPct = Math.round(12 + ((chunkIndex + 1) / totalChunks) * 33);
        setLoadingText(`Uploading heavy ${ext.toUpperCase()} (chunk ${chunkIndex + 1}/${totalChunks})...`);
        setSafeProgress(uploadPct);

        const chunkFormData = new FormData();
        chunkFormData.append('uploadId', uploadId);
        chunkFormData.append('chunkIndex', chunkIndex);
        chunkFormData.append('totalChunks', totalChunks);
        chunkFormData.append('fileName', file.name);
        chunkFormData.append('emailId', emailId);
        chunkFormData.append('isConverter', 'true');
        chunkFormData.append('chunk', chunk);

        try {
          lastRes = await axios.post(`${backendUrl}/api/3d-models/upload-chunk`, chunkFormData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 1200000, // 20 minutes extended timeout for heavy 3D conversions
            maxContentLength: Infinity,
            maxBodyLength: Infinity
          });
        } catch (chunkErr) {
          stopConversionTicker();
          const errMsg = chunkErr.response?.data?.message || chunkErr.message;
          const customErr = new Error(errMsg);
          customErr.response = chunkErr.response;
          throw customErr;
        }
      }

      startConversionTicker(ext, engineName);

      if (lastRes && lastRes.data && lastRes.data.url) {
        stopConversionTicker();
        setLoadingText(`Importing converted ${ext.toUpperCase()} model...`);
        setSafeProgress(78);

        const rawUrl = lastRes.data.url;
        const finalUrl = (rawUrl.startsWith('http://') || rawUrl.startsWith('https://'))
          ? rawUrl
          : `${backendUrl}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;

        return {
          file: null,
          url: finalUrl,
          type: 'glb',
          name: baseName,
          sizeInMB: (file.size / (1024 * 1024)).toFixed(2)
        };
      }
    }

    // Standard files (<= 15MB): Single upload with fast direct URL response
    setLoadingText(`Uploading ${ext.toUpperCase()} model...`);
    setSafeProgress(12);
    const formData = new FormData();
    formData.append('model', file);
    formData.append('emailId', emailId);

    try {
      let uploadDone = false;
      const response = await axios.post(`${backendUrl}/api/3d-models/convert-model`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 1200000, // 20 minutes extended timeout for heavy conversions
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const ratio = Math.min(1, progressEvent.loaded / progressEvent.total);
            const uploadProgress = Math.round(12 + ratio * 33);
            setSafeProgress(uploadProgress);

            if (ratio < 1) {
              setLoadingText(`Uploading ${ext.toUpperCase()} model...`);
            } else if (!uploadDone) {
              uploadDone = true;
              startConversionTicker(ext, engineName);
            }
          }
        }
      });

      stopConversionTicker();
      setLoadingText(`Importing converted ${ext.toUpperCase()} model...`);
      setSafeProgress(78);

      if (response.data && response.data.url) {
        const rawUrl = response.data.url;
        const finalUrl = (rawUrl.startsWith('http://') || rawUrl.startsWith('https://'))
          ? rawUrl
          : `${backendUrl}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;

        return {
          file: null,
          url: finalUrl,
          type: 'glb',
          name: baseName,
          sizeInMB: response.data.sizeInMB || (file.size / (1024 * 1024)).toFixed(2)
        };
      }

      throw new Error("Conversion succeeded but no model URL was returned.");
    } catch (err) {
      stopConversionTicker();
      let message = err.message;
      if (err.response?.data?.message) {
        message = err.response.data.message;
      }
      throw new Error(message);
    }
  };

  const convertModelFileIfNeeded = async (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    const baseName = file.name.replace(/\.[^/.]+$/, "");
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);

    // Direct browser rendering formats: only valid standalone glTF 2.0 binaries / jsons
    const directFormats = {
      'glb': 'glb',
      'gltf': 'glb'
    };

    if (directFormats[ext]) {
      return {
        file,
        url: URL.createObjectURL(file),
        type: directFormats[ext],
        name: baseName,
        sizeInMB
      };
    }

    setManualLoading(true);

    // 1. In-browser instant conversion using Three.js & OpenCASCADE WASM (STEP, STP, IGES, IGS)
    if (ext === 'step' || ext === 'stp' || ext === 'iges' || ext === 'igs') {
      try {
        const glbBlob = await convertCadToGlbBlob(file, ext);
        const glbFile = new File([glbBlob], `${baseName}.glb`, { type: 'model/gltf-binary' });
        const glbUrl = URL.createObjectURL(glbBlob);
        return {
          file: glbFile,
          url: glbUrl,
          type: 'glb',
          name: baseName,
          sizeInMB: (glbBlob.size / (1024 * 1024)).toFixed(2)
        };
      } catch (err) {
        console.warn(`In-browser ${ext.toUpperCase()} conversion notice, using backend OpenCASCADE:`, err.message);
        return await convertModelViaBackend(file, ext, baseName);
      }
    }

    // 2. STL format (use OpenCASCADE / STLLoader)
    if (ext === 'stl') {
      try {
        const glbBlob = await convertStlToGlbBlob(file);
        const glbFile = new File([glbBlob], `${baseName}.glb`, { type: 'model/gltf-binary' });
        const glbUrl = URL.createObjectURL(glbBlob);
        return {
          file: glbFile,
          url: glbUrl,
          type: 'glb',
          name: baseName,
          sizeInMB: (glbBlob.size / (1024 * 1024)).toFixed(2)
        };
      } catch (err) {
        console.warn("In-browser STL conversion notice, using backend OpenCASCADE:", err.message);
        return await convertModelViaBackend(file, ext, baseName);
      }
    }

    // 3. FBX format (Assimp converter with in-browser fallback)
    if (ext === 'fbx') {
      try {
        setLoadingText("Converting FBX model to GLB with Assimp...");
        setSafeProgress(20);
        return await convertModelViaBackend(file, ext, baseName);
      } catch (backendErr) {
        console.warn("Backend Assimp FBX conversion notice, inspecting fallback:", backendErr.message);

        // If it is a known legacy FBX version (6100 / < 7100), browser FBXLoader will also fail
        if (backendErr.message.includes("6100") || backendErr.message.includes("legacy FBX") || backendErr.message.includes("FileVersion")) {
          throw backendErr;
        }

        try {
          const glbBlob = await convertFbxToGlbBlob(file);
          const glbFile = new File([glbBlob], `${baseName}.glb`, { type: 'model/gltf-binary' });
          const glbUrl = URL.createObjectURL(glbBlob);
          return {
            file: glbFile,
            url: glbUrl,
            type: 'glb',
            name: baseName,
            sizeInMB: (glbBlob.size / (1024 * 1024)).toFixed(2)
          };
        } catch (clientErr) {
          console.error("All FBX conversion attempts failed:", clientErr);
          const finalMsg = (backendErr.message && !backendErr.message.includes("status code"))
            ? backendErr.message
            : clientErr.message;
          throw new Error(finalMsg);
        }
      }
    }

    // 4. Other models (OBJ, 3DS, LWO, LOW): use Assimp backend with client fallbacks
    try {
      return await convertModelViaBackend(file, ext, baseName);
    } catch (backendErr) {
      if (ext === 'obj') {
        const glbBlob = await convertObjToGlbBlob(file);
        const glbFile = new File([glbBlob], `${baseName}.glb`, { type: 'model/gltf-binary' });
        return { file: glbFile, url: URL.createObjectURL(glbBlob), type: 'glb', name: baseName, sizeInMB: (glbBlob.size / (1024 * 1024)).toFixed(2) };
      }
      if (ext === '3ds') {
        const glbBlob = await convert3dsToGlbBlob(file);
        const glbFile = new File([glbBlob], `${baseName}.glb`, { type: 'model/gltf-binary' });
        return { file: glbFile, url: URL.createObjectURL(glbBlob), type: 'glb', name: baseName, sizeInMB: (glbBlob.size / (1024 * 1024)).toFixed(2) };
      }
      if (ext === 'lwo' || ext === 'low') {
        const glbBlob = await convertLwoToGlbBlob(file);
        const glbFile = new File([glbBlob], `${baseName}.glb`, { type: 'model/gltf-binary' });
        return { file: glbFile, url: URL.createObjectURL(glbBlob), type: 'glb', name: baseName, sizeInMB: (glbBlob.size / (1024 * 1024)).toFixed(2) };
      }
      throw backendErr;
    }
  };

  const handleAddModel = async (file) => {
      if (!file) return;

      const legacyFbxVer = await checkFbxLegacyVersion(file);
      if (legacyFbxVer) {
          setFormatErrorModal({
              isOpen: true,
              title: `Legacy FBX Format (${legacyFbxVer === 6100 ? "FBX 6.1" : `v${legacyFbxVer}`})`,
              message: `This FBX model was exported using legacy Autodesk FBX ${legacyFbxVer === 6100 ? '6.1 (FileVersion: 6100)' : `v${legacyFbxVer}`} (pre-2011 binary format).\n\nModern 3D web engines (Three.js / WebGL) and Assimp require modern binary FBX 7.1+ (2013-2020) or .GLB / glTF.\n\nHow to fix:\n1. Open your model in Blender, Maya, 3ds Max, or Cinema 4D.\n2. Go to File > Export > FBX.\n3. In export settings, select modern FBX (2014-2020 binary) or export directly as .GLB / glTF.\n4. Upload the newly exported file.`
          });
          return;
      }

      const modelId = Date.now().toString();
      const ext = file.name.split('.').pop().toLowerCase();
      const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);

      startModelLoading({
          id: modelId,
          name: file.name,
          size: `${sizeInMB} MB`,
          type: ext
      });

      try {
          const converted = await convertModelFileIfNeeded(file);

          const newModel = {
              id: modelId,
              url: converted.url,
              file: converted.file,
              type: converted.type || 'glb',
              name: converted.name
          };

          const nextModels = [...models, newModel];
          setModels(nextModels);

          let nextModelName = modelName;
          // If this is the first model, set global name
          if (models.length === 0) {
              nextModelName = newModel.name;
              setModelName(nextModelName);
              resetHistory(buildSnapshot({
                  models: nextModels,
                  modelName: nextModelName,
                  selectedMaterial: null
              }));
          } else {
              commitHistoryNow(buildSnapshot({
                  models: nextModels,
                  modelName: nextModelName,
                  selectedMaterial: null // Reset selection on new model to be safe
              }));
          }

          setIsSidebarCollapsed(false);
          startMountingBridgeTicker(loadingProgressRef.current);
          // Loader remains active while Three.js loads, calculates bounding box, and positions the model on base.
          // handleModelReady() is called once the model has physically rendered on the base!
      } catch (err) {
          console.error("Error adding/converting model:", err);
          clearAllLoadingTimers();
          setManualLoading(false);
          loadingProgressRef.current = 0;
          setLoadingProgress(0);
          setLoadingText("");
          setLoadingModelInfo(null);
          pendingModelIdRef.current = null;
          isCompletingRef.current = false;
          
          const errMsg = err.response?.data?.message || err.message || "Failed to add 3D model";
          if (errMsg.includes("6100") || errMsg.includes("legacy FBX") || errMsg.includes("FileVersion")) {
              setFormatErrorModal({
                  isOpen: true,
                  title: "Legacy FBX Format (FileVersion: 6100)",
                  message: errMsg
              });
          } else {
              toast.error(errMsg);
          }
      }
  };

  const handleSetModelStats = useCallback((modelId, stats) => {
      setModelStatsMap(prev => {
          if (prev[modelId] === stats) return prev;
          try {
              if (JSON.stringify(prev[modelId]) === JSON.stringify(stats)) return prev;
          } catch (_) {}
          return { ...prev, [modelId]: stats };
      });
  }, []);

  const handleSetMaterialList = useCallback((modelId, list, dataMap) => {
      setModelMaterialLists(prev => {
          if (prev[modelId] === list) return prev;
          try {
              if (JSON.stringify(prev[modelId]) === JSON.stringify(list)) return prev;
          } catch (_) {}
          const next = { ...prev, [modelId]: list };
          modelMaterialListsRef.current = next;
          updateHistory(buildSnapshot({
              modelMaterialLists: next
          }));
          return next;
      });

      if (dataMap) {
          setModelMaterialDataMap(prev => {
              if (prev[modelId] === dataMap) return prev;
              return { ...prev, [modelId]: dataMap };
          });
      }
  }, [updateHistory, buildSnapshot]);

  // Two-Step Compression Export
  // Step 1: Three.js GLTFExporter -> raw GLB ArrayBuffer (captures all editor material changes)
  // Step 2: gltf-transform (dedup+prune+reorder/Meshopt) post-process -> real geometry compression
  // Quality: Low=512px | Medium=1024px | High=2048px | Original=4096px (canvas downscale)
  // Compression slider > 0 + GLB format -> Step 2 Meshopt applied

  const handleExport = async (exportSettings) => {
    const {
        exportScope,
        selectedMaterial,
        exportFormat,
        fileName,
        customMaterialNames,
        compression     = 0,
        includeTextures = true,
        embedTextures   = true,
        quality         = 'Medium',
        orientation     = 'Y axis up',
        exportSeparate  = false,
    } = typeof exportSettings === 'object' ? exportSettings : { exportFormat: exportSettings };

    const format = exportFormat?.toLowerCase() || 'glb';
    if (!sceneWrapperRef.current || models.length === 0) return;
    setManualLoading(true);

    setLoadingText("Preparing export...");
    const name       = fileName || modelName || (models.length > 0 ? models[0].name : "Scene");
    const isGLB      = format === 'glb' || format === 'gltf';
    const useMeshopt = isGLB && compression > 0;
    const qualityTextureSize = { Low: 512, Medium: 1024, High: 2048, Original: 4096 }[quality] ?? 1024;

    const TEX_KEYS         = ['map','normalMap','roughnessMap','metalnessMap','aoMap','emissiveMap','alphaMap','bumpMap','displacementMap'];
    const originalTextures = new Map();
    const visibilityMap    = new Map();

    // 1. Prepare scene clone for processing to avoid touching live scene
    const scene = SkeletonUtils.clone(sceneWrapperRef.current);
    
    // Ensure materials are only cloned once (shared materials stay shared)
    const clonedMaterials = new Map();
    scene.traverse((obj) => {
        if (obj.isMesh && obj.material) {
            if (Array.isArray(obj.material)) {
                obj.material = obj.material.map(m => {
                    if (!clonedMaterials.has(m)) clonedMaterials.set(m, m.clone());
                    return clonedMaterials.get(m);
                });
            } else {
                const m = obj.material;
                if (!clonedMaterials.has(m)) clonedMaterials.set(m, m.clone());
                obj.material = clonedMaterials.get(m);
            }
        }
    });

    const isZUp = orientation === 'Z axis up';
    
    // Apply Orientation transformation to clone
    if (isZUp) {
        scene.rotation.x = -Math.PI / 2;
        scene.updateMatrixWorld(true);
    }

    scene.traverse((obj) => {
        if (obj.isMesh || obj.isLight || obj.isHelper) visibilityMap.set(obj, obj.visible);
        if (obj.isMesh && obj.material) {
            const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
            mats.forEach((mat) => {
                // Sanitization for Export: Fix depth sorting and transparency glitches
                const isTrans = (mat.opacity < 0.99) || !!mat.alphaMap;
                mat.transparent = isTrans;
                mat.depthWrite = !isTrans;
                mat.alphaTest = 0;

                if (!originalTextures.has(mat)) {
                    const snap = {};
                    TEX_KEYS.forEach(k => { snap[k] = mat[k]; });
                    originalTextures.set(mat, snap);
                }
            });
        }
    });

    const restoreAll = () => {
        if (isZUp) {
            scene.rotation.x = 0;
            scene.updateMatrixWorld(true);
        }
        visibilityMap.forEach((v, obj) => { if (obj) obj.visible = v; });
        originalTextures.forEach((snap, mat) => {
            TEX_KEYS.forEach(k => { mat[k] = snap[k]; });
            mat.needsUpdate = true;
        });
    };

    const applyTexturePolicy = () => {
        if (!includeTextures) {
            originalTextures.forEach((_snap, mat) => {
                TEX_KEYS.forEach(k => { mat[k] = null; });
                mat.needsUpdate = true;
            });
        }
    };

    // STEP 1: Three.js scene -> raw GLB ArrayBuffer
    const exportSceneToGLBBuffer = (targetScene) => new Promise((resolve, reject) => {
        let exportRoot = targetScene;

        const exportAnimations = [];
        const seenClipIds = new Set();
        const addClip = (anim) => {
            if (anim && Array.isArray(anim.tracks) && anim.tracks.length > 0) {
                const id = anim.name || anim.uuid;
                if (!seenClipIds.has(id)) {
                    seenClipIds.add(id);
                    exportAnimations.push(anim.clone());
                }
            }
        };

        if (exportRoot.animations && Array.isArray(exportRoot.animations)) {
            exportRoot.animations.forEach(addClip);
        }
        exportRoot.traverse((child) => {
            if (child.animations && Array.isArray(child.animations)) {
                child.animations.forEach(addClip);
            }
        });
        targetScene.traverse((child) => {
            if (child.animations && Array.isArray(child.animations)) {
                child.animations.forEach(addClip);
            }
        });
        models.forEach((m) => {
            if (m.animations && Array.isArray(m.animations)) {
                m.animations.forEach(addClip);
            }
            if (m.scene?.animations && Array.isArray(m.scene.animations)) {
                m.scene.animations.forEach(addClip);
            }
        });

        // Sanitize animation track names to match nodes in exportRoot
        const sanitizedExportAnimations = [];
        exportAnimations.forEach(clip => {
            const clonedClip = clip.clone();
            const resolvableTracks = [];
            clonedClip.tracks.forEach(track => {
                const clonedTrack = track.clone();
                const parts = clonedTrack.name.split('.');
                const propertyName = parts.pop();
                const targetPath = parts.join('.');
                
                let targetNode = THREE.PropertyBinding.findNode(exportRoot, targetPath);
                if (!targetNode && targetPath.includes('/')) {
                    const baseNodeName = targetPath.split('/').pop();
                    const found = exportRoot.getObjectByName(baseNodeName);
                    if (found) {
                        clonedTrack.name = `${baseNodeName}.${propertyName}`;
                        targetNode = found;
                    }
                } else if (!targetNode) {
                    const found = exportRoot.getObjectByName(targetPath);
                    if (found) {
                        targetNode = found;
                    }
                }
                if (targetNode) {
                    resolvableTracks.push(clonedTrack);
                }
            });
            if (resolvableTracks.length > 0) {
                clonedClip.tracks = resolvableTracks;
                sanitizedExportAnimations.push(clonedClip);
            }
        });

        // Strip any cloned helper tools, cameras, lights, or corrupt meshes
        const controlsToRemove = [];
        exportRoot.traverse((obj) => {
            if (
                obj.isTransformControls || 
                obj.isTransformControlsGizmo || 
                obj.isTransformControlsPlane || 
                obj.isCamera ||
                obj.isLight ||
                obj.type === 'TransformControls' || 
                obj.type === 'TransformControlsGizmo' || 
                obj.type === 'TransformControlsPlane' ||
                obj.name?.toLowerCase().includes('transformcontrols') ||
                obj.name?.toLowerCase().includes('gizmo')
            ) {
                controlsToRemove.push(obj);
                return;
            }

            if (obj.isMesh || obj.isLine || obj.isPoints) {
                if (!obj.geometry || !obj.geometry.attributes || !obj.geometry.attributes.position || !obj.geometry.attributes.position.array || obj.geometry.attributes.position.count === 0) {
                    controlsToRemove.push(obj);
                    return;
                }
            }

            if (obj.isSkinnedMesh) {
                if (!obj.skeleton || !Array.isArray(obj.skeleton.bones) || obj.skeleton.bones.length === 0) {
                    obj.isSkinnedMesh = false;
                    delete obj.skeleton;
                    delete obj.bindMatrix;
                    delete obj.bindMatrixInverse;
                }
            }
        });
        controlsToRemove.forEach((obj) => {
            if (obj.parent) obj.parent.remove(obj);
        });

        // Restore all hierarchy nodes (bones and animated parent nodes) to pristine rest/bind pose before export
        exportRoot.traverse((child) => {
            if (child.userData?.__bindPos && child.userData?.__bindQuat && child.userData?.__bindScale) {
                const p = child.userData.__bindPos;
                const q = child.userData.__bindQuat;
                const s = child.userData.__bindScale;
                child.position.set(p[0], p[1], p[2]);
                if (Math.hypot(q[0], q[1], q[2], q[3]) > 0.0001) {
                    child.quaternion.set(q[0], q[1], q[2], q[3]).normalize();
                } else {
                    child.quaternion.identity();
                }
                child.scale.set(s[0], s[1], s[2]);
                child.updateMatrix();
            } else if (child.isBone) {
                if (child.userData?.__bindPos) {
                    const p = child.userData.__bindPos;
                    child.position.set(p[0], p[1], p[2]);
                }
                if (child.userData?.__bindQuat) {
                    const q = child.userData.__bindQuat;
                    if (Math.hypot(q[0], q[1], q[2], q[3]) > 0.0001) {
                        child.quaternion.set(q[0], q[1], q[2], q[3]).normalize();
                    }
                }
                if (child.userData?.__bindScale) {
                    const s = child.userData.__bindScale;
                    child.scale.set(s[0], s[1], s[2]);
                }
                if (!child.userData?.__bindQuat && child.userData?.__bindTransform?.quaternion) {
                    const q = child.userData.__bindTransform.quaternion;
                    const qx = q.x !== undefined ? q.x : q._x;
                    const qy = q.y !== undefined ? q.y : q._y;
                    const qz = q.z !== undefined ? q.z : q._z;
                    const qw = q.w !== undefined ? q.w : (q._w !== undefined ? q._w : 1);
                    if (qx !== undefined && !isNaN(qx) && Math.hypot(qx, qy, qz, qw) > 0.0001) {
                        child.quaternion.set(qx, qy, qz, qw).normalize();
                    }
                }
                child.updateMatrix();
            }
        });

        try {
            exportRoot.updateMatrixWorld(true);
        } catch (e) {
            console.warn("Matrix update warning during GLB export:", e);
        }

        new GLTFExporter().parse(
            exportRoot,
            (result) => resolve(result instanceof ArrayBuffer ? result : new TextEncoder().encode(JSON.stringify(result)).buffer),
            reject,
            { 
                binary: true, 
                forceIndices: true, 
                trs: true,            // CRITICAL: Export clean TRS (translation/rotation/scale) per node instead of matrix
                onlyVisible: false,   // CRITICAL: Never omit invisible bones/joints from the skeleton
                maxTextureSize: qualityTextureSize, 
                embedImages: embedTextures, 
                includeCustomExtensions: false,
                animations: (sanitizedExportAnimations && sanitizedExportAnimations.length > 0) ? sanitizedExportAnimations : []
            }
        );
    });

    // STEP 2: gltf-transform Meshopt post-process
    const applyMeshoptToBuffer = async (glbBuffer) => {
        setLoadingText("Applying Meshopt compression...");
        try {
            const { WebIO }                 = await import('@gltf-transform/core');
            const { EXTMeshoptCompression } = await import('@gltf-transform/extensions');
            const { dedup, prune, reorder } = await import('@gltf-transform/functions');
            await MeshoptEncoder.ready;
            const io  = new WebIO().registerExtensions([EXTMeshoptCompression]);
            const doc = await io.readBinary(new Uint8Array(glbBuffer));
            await doc.transform(dedup(), prune(), reorder({ encoder: MeshoptEncoder }));
            return (await io.writeBinary(doc)).buffer;
        } catch (err) {
            console.error("Meshopt compression failed - using uncompressed GLB:", err);
            return glbBuffer;
        }
    };

    const exportNonGLBBlob = (targetScene) => {
        if (format === 'stl') return new Blob([new STLExporter().parse(targetScene)], { type: 'application/octet-stream' });
        throw new Error("Unsupported format: " + format);
    };

    const triggerDownload = (data, dlName) => {
        const blob = data instanceof Blob ? data : new Blob([data], { type: 'application/octet-stream' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob); a.download = dlName; a.click();
    };

    try {
        applyTexturePolicy();

        if (exportScope === 'selection' && selectedMaterial) {
            const names = selectedMaterial.isGroup ? selectedMaterial.materials : [selectedMaterial.name];
            const nameSet = new Set(names);
            scene.traverse((obj) => {
                if (obj.isMesh && obj.material) {
                    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
                    const hit = (obj.name && nameSet.has(obj.name)) || mats.some(m => nameSet.has(m.name));
                    obj.visible = hit;
                } else if (obj.isLight || obj.isHelper) {
                    obj.visible = false;
                }
            });
        }

        // Direct single GLB export - no ZIP wrapper
        if (isGLB) {
            setLoadingText("Exporting model as GLB...");
            let buf = await exportSceneToGLBBuffer(scene);
            if (useMeshopt) buf = await applyMeshoptToBuffer(buf);
            triggerDownload(buf, name.replace(/\s+/g, '_') + "." + format);
        } else {
            setLoadingText("Exporting model...");
            triggerDownload(exportNonGLBBlob(scene), name.replace(/\s+/g, '_') + "." + format);
        }
    } catch (error) {
        console.error("Export error:", error);
        toast.error("Export failed. Please try again.");
    } finally {
        restoreAll();
        
        // Memory Cleanup: Dispose of cloned materials and temporary downscaled canvas textures ONLY
        // CRITICAL: NEVER call obj.geometry.dispose() here because SkeletonUtils.clone shares
        // geometries with the live scene by reference. Disposing geometries crashes the WebGL renderer
        // with "THREE.WebGLRenderer: Context Lost"!
        clonedMaterials.forEach((m) => {
            if (m) {
                TEX_KEYS.forEach(k => { 
                    if (m[k] && m[k].isTexture && m[k].image instanceof HTMLCanvasElement) {
                        m[k].dispose(); 
                    }
                });
                m.dispose();
            }
        });
        clonedMaterials.clear();
        originalTextures.clear();
        visibilityMap.clear();

        try {
            scene.clear();
        } catch (_) {}

        setManualLoading(false);
        setLoadingText("");
    }
  };

  const combinedStats = useMemo(() => {
      let vCount = 0; let pCount = 0; let mCount = 0;
      Object.keys(modelStatsMap).forEach(key => {
          const s = modelStatsMap[key];
          if (s.vertexCount) vCount += parseInt(s.vertexCount.toString().replace(/,/g, '')) || 0;
          if (s.polygonCount) pCount += parseInt(s.polygonCount.toString().replace(/,/g, '')) || 0;
          if (s.materialCount) mCount += parseInt(s.materialCount) || 0;
      });
      return {
          vertexCount: vCount.toLocaleString(),
          polygonCount: pCount.toLocaleString(),
          materialCount: mCount.toString(),
          fileSize: modelStats?.fileSize || "0 MB",
          dimensions: models.length > 1 ? "Multiple Models" : (modelStatsMap[models[0]?.id]?.dimensions || "0 X 0 X 0 unit")
      };
  }, [modelStatsMap, modelStats?.fileSize, models]);

  const activeMaterialList = useMemo(() => {
      const isNodeDeleted = (n) => {
          if (!n || !deletedMaterials || deletedMaterials.size === 0) return false;
          if (typeof n === 'string') return deletedMaterials.has(n);
          if (n.uuid && deletedMaterials.has(n.uuid)) return true;
          if (n.meshUuid && deletedMaterials.has(n.meshUuid)) return true;
          if (n.id && deletedMaterials.has(n.id)) return true;
          if (n.isMesh) {
              // A mesh is deleted if and only if its unique uuid/meshUuid/id was deleted
              return false;
          }
          if (n.name && deletedMaterials.has(n.name)) return true;
          if (n.material && deletedMaterials.has(n.material)) return true;
          if (Array.isArray(n.materials) && n.materials.length > 0 && n.materials.every(m => deletedMaterials.has(typeof m === 'string' ? m : (m?.name || m)))) {
              return true;
          }
          return false;
      };

      const filterTreeNodes = (nodes) => {
          if (!Array.isArray(nodes)) return [];
          const filtered = [];
          for (const node of nodes) {
              if (isNodeDeleted(node)) continue;
              if (Array.isArray(node.children) && node.children.length > 0) {
                  const cleanedChildren = filterTreeNodes(node.children);
                  if (node.isGroup && cleanedChildren.length === 0) {
                      continue;
                  }
                  filtered.push({ ...node, children: cleanedChildren });
              } else {
                  filtered.push(node);
              }
          }
          return filtered;
      };

      const result = [];
      models.forEach(model => {
          const rawList = modelMaterialLists[model.id] || [];
          if (Array.isArray(rawList) && rawList.length > 0) {
              const cleanedTree = filterTreeNodes(rawList);
              const matNames = new Set();
              const findMats = (node) => {
                  if (!node) return;
                  if (typeof node === 'string') {
                      if (!deletedMaterials.has(node)) matNames.add(node);
                      return;
                  }
                  if (typeof node.material === 'string' && !deletedMaterials.has(node.material)) {
                      matNames.add(node.material);
                  }
                  if (Array.isArray(node.materials)) {
                      node.materials.forEach(m => {
                          const mName = typeof m === 'string' ? m : (m?.name || m);
                          if (mName && !deletedMaterials.has(mName)) matNames.add(mName);
                      });
                  }
                  if (Array.isArray(node.children)) node.children.forEach(findMats);
              };
              cleanedTree.forEach(findMats);

              result.push({
                  id: model.id,
                  group: model.name,
                  tree: cleanedTree,
                  materials: Array.from(matNames)
              });
          }
      });
      return result;
  }, [models, modelMaterialLists, deletedMaterials]);

  const handleToggleVisibility = useCallback((matTarget, isVisible) => {
      const next = new Set(hiddenMaterials);
      
      const keysToProcess = [];
      if (Array.isArray(matTarget)) {
          matTarget.forEach(t => {
              if (typeof t === 'string') keysToProcess.push(t);
              else if (t?.uuid) keysToProcess.push(t.uuid);
              else if (t?.meshUuid) keysToProcess.push(t.meshUuid);
          });
      } else if (matTarget && typeof matTarget === 'object') {
          if (matTarget.isMesh || (!matTarget.isGroup && (matTarget.meshUuid || matTarget.uuid))) {
              if (matTarget.meshUuid) keysToProcess.push(matTarget.meshUuid);
              if (matTarget.uuid) keysToProcess.push(matTarget.uuid);
          } else if (matTarget.isMultiSelect || Array.isArray(matTarget.items) || Array.isArray(matTarget.uuids)) {
              if (Array.isArray(matTarget.uuids)) keysToProcess.push(...matTarget.uuids);
              if (Array.isArray(matTarget.items)) {
                  matTarget.items.forEach(it => {
                      if (it?.uuid) keysToProcess.push(it.uuid);
                      if (it?.meshUuid) keysToProcess.push(it.meshUuid);
                  });
              }
          } else {
              if (matTarget.meshUuid) keysToProcess.push(matTarget.meshUuid);
              if (matTarget.uuid) keysToProcess.push(matTarget.uuid);
              if (matTarget.name) keysToProcess.push(matTarget.name);
              if (!matTarget.uuid && !matTarget.meshUuid && matTarget.material && typeof matTarget.material === 'string') {
                  keysToProcess.push(matTarget.material);
              }
          }
      } else if (matTarget) {
          keysToProcess.push(matTarget);
      }

      keysToProcess.forEach(k => {
          if (!k || typeof k !== 'string') return;
          if (isVisible) {
              next.delete(k);
          } else {
              next.add(k);
          }
      });

      setHiddenMaterials(next);

      commitHistoryNow(buildSnapshot({
          hiddenMaterials: Array.from(next),
          materialSettings: materialSettings 
      }));
  }, [hiddenMaterials, materialSettings, commitHistoryNow, buildSnapshot]);

  // Auto-expand sidebar when a specific material is selected
  useEffect(() => {
    if (selectedMaterial && selectedMaterial.name !== (modelName || "Model")) {
        setIsSidebarCollapsed(false);
    }
  }, [selectedMaterial, modelName, setIsSidebarCollapsed]);

  const handleDeleteModel = useCallback((modelId) => {
      const modelToDelete = models.find(m => m.id === modelId || m.name === modelId);
      const targetId = modelToDelete ? modelToDelete.id : (modelId || models[0]?.id);
      if (!targetId && models.length === 0) return;
      
      const nextModels = targetId ? models.filter(m => m.id !== targetId) : [];
      setModels(nextModels);
      
      const nextMaterialLists = { ...modelMaterialLists };
      if (targetId) delete nextMaterialLists[targetId];
      else Object.keys(nextMaterialLists).forEach(k => delete nextMaterialLists[k]);
      setModelMaterialLists(nextMaterialLists);

      const nextStatsMap = { ...modelStatsMap };
      if (targetId) delete nextStatsMap[targetId];
      else Object.keys(nextStatsMap).forEach(k => delete nextStatsMap[k]);
      setModelStatsMap(nextStatsMap);

      setModelHasAnimationsMap(prev => {
          if (!targetId) return {};
          if (!prev[targetId]) return prev;
          const next = { ...prev };
          delete next[targetId];
          return next;
      });

      setSelectedMaterial(null);

      // If no models remain or deleting this model, clear or update associated hotspots
      const nextHotspots = nextModels.length === 0 
        ? [] 
        : hotspots.filter(h => h.modelId !== targetId && h.meshName !== modelToDelete?.name);

      setHotspots(nextHotspots);
      if (nextModels.length === 0 || nextHotspots.length === 0) {
        setActiveHotspotId(null);
        setEditingHotspot(null);
        setShowHotspotModal(false);
        setIsPlacingHotspot(false);
        isPlacingHotspotRef.current = false;
        if (nextModels.length === 0) {
          setRightPanelMode('edit');
        }
      }

      setThreedState(prev => ({
        ...prev,
        models: nextModels,
        hotspots: nextHotspots
      }));

      commitHistoryNow(buildSnapshot({
          models: nextModels,
          modelMaterialLists: nextMaterialLists,
          selectedMaterial: null,
          hotspots: nextHotspots
      }));
  }, [models, modelMaterialLists, modelStatsMap, hotspots, commitHistoryNow, buildSnapshot, setThreedState]);

  const handleDeleteMaterial = useCallback((matTarget) => {
      const next = new Set(deletedMaterials);
      
      const addKeys = (item) => {
          if (!item) return;
          if (typeof item === 'string') { next.add(item); return; }

          // If this is a mesh, multiple mesh selection, or group of meshes:
          // Strictly delete ONLY by mesh UUIDs so other meshes sharing the same material are NEVER deleted!
          if (item.isMesh || item.isMultiSelect || Array.isArray(item.items) || Array.isArray(item.uuids)) {
              if (item.uuid) next.add(item.uuid);
              if (item.meshUuid) next.add(item.meshUuid);
              if (item.id) next.add(item.id);
              if (Array.isArray(item.uuids)) item.uuids.forEach(u => next.add(u));
              if (Array.isArray(item.items)) {
                  item.items.forEach(it => {
                      if (it?.uuid) next.add(it.uuid);
                      if (it?.meshUuid) next.add(it.meshUuid);
                      if (it?.id) next.add(it.id);
                  });
              }
              return;
          }

          if (item.uuid) next.add(item.uuid);
          if (item.meshUuid) next.add(item.meshUuid);
          if (item.id) next.add(item.id);
          if (Array.isArray(item.children)) item.children.forEach(addKeys);
          if (Array.isArray(item.meshNames)) item.meshNames.forEach(addKeys);

          // Only add material name if this item is explicitly a material object/folder without mesh UUIDs
          if (!item.uuid && !item.meshUuid && item.material && typeof item.material === 'string') {
              next.add(item.material);
          }
      };

      if (Array.isArray(matTarget)) {
          matTarget.forEach(addKeys);
      } else {
          addKeys(matTarget);
      }

      setDeletedMaterials(next);

      // Automatically clear selection after deletion
      setSelectedMaterial(null);

      // Remove any hotspots that were placed on deleted meshes
      const remainingHotspots = hotspots.filter(h => {
        if (h.meshUuid && next.has(h.meshUuid)) return false;
        if (h.meshName && next.has(h.meshName)) return false;
        return true;
      });
      if (remainingHotspots.length !== hotspots.length) {
        setHotspots(remainingHotspots);
        if (activeHotspotId && !remainingHotspots.some(h => String(h.id) === String(activeHotspotId))) {
          setActiveHotspotId(null);
        }
      }

      commitHistoryNow(buildSnapshot({
          deletedMaterials: Array.from(next),
          materialSettings: materialSettings,
          selectedMaterial: null,
          hotspots: remainingHotspots
      }));
  }, [deletedMaterials, materialSettings, hotspots, activeHotspotId, commitHistoryNow, buildSnapshot]);

  const handleSelectAllMeshes = useCallback(() => {
      if (models.length === 0) return;

      const allMaterials = [];
      const allUuids = [];
      const allMeshNames = [];

      // Collect from live sceneWrapper if available
      if (sceneWrapperRef.current) {
          sceneWrapperRef.current.traverse((child) => {
              if ((child.isMesh || child.isSkinnedMesh) && child.material && !deletedMaterials.has(child.uuid)) {
                  if (child.uuid) allUuids.push(child.uuid);
                  if (child.name) allMeshNames.push(child.name);
                  const mats = Array.isArray(child.material) ? child.material : [child.material];
                  mats.forEach((m) => {
                      if (m?.name) allMaterials.push(m.name);
                  });
              }
          });
      }

      // Collect from modelMaterialLists
      models.forEach((model) => {
          const rawList = modelMaterialLists[model.id] || [];
          const findMats = (node) => {
              if (!node) return;
              if (node.uuid && !deletedMaterials.has(node.uuid)) allUuids.push(node.uuid);
              if (node.meshUuid && !deletedMaterials.has(node.meshUuid)) allUuids.push(node.meshUuid);
              if (node.name) allMeshNames.push(node.name);
              if (node.material) allMaterials.push(node.material);
              if (Array.isArray(node.materials)) {
                  node.materials.forEach((m) => allMaterials.push(typeof m === 'string' ? m : (m?.name || m)));
              }
              if (Array.isArray(node.children)) node.children.forEach(findMats);
          };
          rawList.forEach(findMats);
      });

      const uniqueMats = Array.from(new Set(allMaterials)).filter((m) => !deletedMaterials.has(m));
      const uniqueUuids = Array.from(new Set(allUuids));
      const uniqueNames = Array.from(new Set(allMeshNames));

      setSelectedMaterial({
          name: modelName || "All Meshes",
          parentGroup: modelName,
          isAll: true,
          isGroup: true,
          isMultiSelect: true,
          uuids: uniqueUuids,
          meshNames: uniqueNames,
          materials: uniqueMats,
          ts: Date.now()
      });
  }, [models, modelMaterialLists, deletedMaterials, modelName]);

  const handleDeleteCurrentSelection = useCallback(() => {
      if (!selectedMaterial) {
          // If nothing is explicitly selected, delete active model
          if (models.length > 0) {
              handleDeleteModel(models[0]?.id);
          }
          return;
      }

      if (selectedMaterial.isAll) {
          // All meshes selected -> delete model
          if (models.length > 0) {
              handleDeleteModel(models[0]?.id);
          } else {
              handleDeleteMaterial(selectedMaterial);
          }
          return;
      }

      if (selectedMaterial.isGroup || selectedMaterial.isMultiSelect || Array.isArray(selectedMaterial.items) || Array.isArray(selectedMaterial.uuids)) {
          handleDeleteMaterial(selectedMaterial);
          return;
      }

      const matName = selectedMaterial.name;
      if (matName === modelName || matName === "Scene") {
          // Delete entire model
          handleDeleteModel(models[0]?.id || matName);
      } else {
          // Delete single material / mesh
          handleDeleteMaterial(selectedMaterial);
      }
  }, [selectedMaterial, models, modelName, handleDeleteModel, handleDeleteMaterial]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in an input, textarea, or contentEditable element
      if (
        e.target.tagName === 'INPUT' ||
        e.target.tagName === 'TEXTAREA' ||
        e.target.isContentEditable ||
        e.target.closest?.('input, textarea, [contenteditable="true"]')
      ) {
        return;
      }

      const keyLower = e.key.toLowerCase();

      if ((e.ctrlKey || e.metaKey) && keyLower === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && keyLower === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (keyLower === 'a' && !e.altKey) {
        // Pressing 'A' or 'Ctrl+A' selects all meshes in the scene
        e.preventDefault();
        handleSelectAllMeshes();
      } else if (e.key === 'Escape') {
        // Pressing 'Escape' deselects all
        setSelectedMaterial(null);
      } else if (keyLower === 'h') {
        if (selectedMaterial && selectedMaterial.name) {
          e.preventDefault();
          const matName = selectedMaterial.name;
          const isCurrentlyHidden = hiddenMaterials.has(matName);
          handleToggleVisibility(matName, isCurrentlyHidden);
        }
      } else if (e.key === 'Delete' || e.key === 'Del' || keyLower === 'delete' || e.key === 'Backspace' || keyLower === 'd') {
        // Pressing Delete key (or Backspace / 'd') deletes the selected model or mesh
        e.preventDefault();
        handleDeleteCurrentSelection();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleUndo,
    handleRedo,
    handleSelectAllMeshes,
    handleDeleteCurrentSelection,
    selectedMaterial,
    hiddenMaterials,
    handleToggleVisibility,
  ]);

  const handleRename = useCallback(async (newName) => {
    if (!newName || !newName.trim()) return;

    const oldModelName = modelName;
    setModelName(newName);

    try {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return;
      const user = JSON.parse(storedUser);
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

      // Update local model list name immediately (for UI consistency)
      const nextModels = models.map(m => {
        if (m.name === oldModelName || models.length === 1) {
          return { ...m, name: newName };
        }
        return m;
      });
      setModels(nextModels);

      const nextSnapshot = buildSnapshot({
        modelName: newName,
        models: nextModels
      });
      commitHistoryNow(nextSnapshot);

      // ── INTERACTION MODE (opened from 3D Edit in InteractionPanel) ──
      // Only update the display label in DB. Physical file and URL are untouched.
      if (urlModelId) {
        try {
          await axios.post(`${backendUrl}/api/3d-models/rename-label`, {
            emailId: user.emailId,
            modelId: urlModelId,
            newName: newName.trim()
          });
        } catch (e) {
          console.error("DB label rename failed:", e);
        }

        // Persist updated session state (name only)
        await axios.post(`${backendUrl}/api/3d-models/save-session`, {
          emailId: user.emailId,
          state: nextSnapshot
        });
        return;
      }

      // ── STANDALONE GALLERY MODE ──
      // Rename the actual file on server and update DB with new path.
      const renameIndex = nextModels.findIndex(m => m.name === newName);
      if (renameIndex !== -1) {
        const target = nextModels[renameIndex];
        if (target.url && !target.url.startsWith('blob:')) {
          const oldFileName = target.url.split('/').pop();
          try {
            const renameRes = await axios.post(`${backendUrl}/api/3d-models/rename-model`, {
              emailId: user.emailId,
              oldName: oldFileName,
              newName: newName,
              modelId: target.modelId
            });
            if (renameRes.data && renameRes.data.url) {
              const updatedUrl = `${backendUrl}${renameRes.data.url}`;
              nextModels[renameIndex].url = updatedUrl;
              
              setModels([...nextModels]);
              if (renameIndex === 0) setModelUrl(updatedUrl);

              // Broadcast rename to parent tab (InteractionPanel) via BroadcastChannel
              try {
                const bc = new BroadcastChannel('threed_model_updates');
                bc.postMessage({
                  type: 'model-renamed',
                  modelId: target.modelId,
                  oldName: oldFileName,
                  newName: renameRes.data.newName || newName,
                  newUrl: updatedUrl,
                  newRelativeUrl: renameRes.data.url
                });
                bc.close();
              } catch (bcErr) {
                console.warn('BroadcastChannel not supported:', bcErr);
              }
            }
          } catch (e) {
            console.error("Server-side file rename failed:", e);
          }
        }
      }

      // Persist updated session state
      await axios.post(`${backendUrl}/api/3d-models/save-session`, {
        emailId: user.emailId,
        state: nextSnapshot
      });

    } catch (error) {
      console.error("Failed to update backend rename:", error);
    }
  }, [models, modelName, commitHistoryNow, buildSnapshot, setModelUrl, urlModelId]);


  const handleRenameMaterial = useCallback((oldName, newName, mName) => {
      // Find the model with this name
      const model = models.find(m => m.name === mName || m.originalName === mName);
      if (model && modelRefs.current.get(model.id)) {
          modelRefs.current.get(model.id).renameMaterial(oldName, newName);
      } else if (modelRef.current) {
          modelRef.current.renameMaterial(oldName, newName);
      }

      let nextMaterialLists = modelMaterialLists;
      if (model) {
          const prevList = modelMaterialLists[model.id] || [];
          const renameNode = (item) => {
              if (typeof item === 'string') {
                  return item === oldName ? newName : item;
              }
              if (!item || typeof item !== 'object') return item;
              const updated = { ...item };
              if (updated.name === oldName) updated.name = newName;
              if (updated.material === oldName) updated.material = newName;
              if (Array.isArray(updated.materials)) {
                  updated.materials = updated.materials.map(m => m === oldName ? newName : m);
              }
              if (Array.isArray(updated.children)) {
                  updated.children = updated.children.map(renameNode);
              }
              return updated;
          };
          const nextList = prevList.map(renameNode);
          nextMaterialLists = { ...modelMaterialLists, [model.id]: nextList };
          setModelMaterialLists(nextMaterialLists);
          
          commitHistoryNow(buildSnapshot({
              modelMaterialLists: nextMaterialLists
          }));
      }

      if (selectedMaterial && (selectedMaterial.name === oldName)) {
           setSelectedMaterial(prev => {
               if (!prev) return prev;
               return { ...prev, name: newName };
           });
      }
  }, [models, selectedMaterial, modelMaterialLists, commitHistoryNow, buildSnapshot]);



  const updateMaterialSetting = useCallback((key, val, fromSync = false) => {
    setMaterialSettings((prev) => {
      if (val !== null && typeof val === 'object') {
          if (prev[key] === val) return prev;
          try {
              if (JSON.stringify(prev[key]) === JSON.stringify(val)) return prev;
          } catch (_) {}
      } else if (prev[key] === val) {
          return prev;
      }
      
      // Preserve custom HDR / envMap when maps are updated
      let effectiveVal = val;
      if (key === 'maps') {
          const preservedEnvMap = prev.customEnvMap || prev.maps?.envMap || null;
          if (preservedEnvMap && val && typeof val === 'object') {
              effectiveVal = { ...val, envMap: preservedEnvMap };
          }
      }

      const next = { ...prev, [key]: effectiveVal };
      if (key === 'maps' && prev.customEnvMap) {
          next.customEnvMap = prev.customEnvMap;
      }
      
      if (!fromSync) {
          // If a material-specific property is changed, enable the override flag
          // so that the changes apply in "Full Model" mode, and record the changed property.
          const materialKeys = [
              'color', 'metallic', 'roughness', 'alpha', 'emissiveIntensity', 
              'emissiveColor', 'normal', 'bump', 'scale', 'rotation', 'offset', 
              'colorIntensity', 'ao', 'reflection', 'specular', 'worldOpacity', 'worldBlur',
              'shadow', 'softness', 'envRotation', 'lightPosition'
          ];
          if (materialKeys.includes(key)) {
              next.useFactorColor = true;
              next.lastChangedProp = key;
          }

          const snapshot = buildSnapshot({ materialSettings: next });
          const discreteKeys = ['environment', 'appliedTexture'];
          if (discreteKeys.includes(key)) {
              commitHistoryNow(snapshot);
          } else {
              commitHistoryDebounced(snapshot);
          }
      } else {
          // When syncing from model to UI, ensure factor override and lastChangedProp are disabled
          next.useFactorColor = false;
          next.lastChangedProp = null;
      }
      
      return next;
    });
  }, [buildSnapshot, commitHistoryNow, commitHistoryDebounced]);

  // Memoized handler for syncing from model (GenericModel) to avoid loop
  const handleMaterialSync = useCallback((key, val) => {
      updateMaterialSetting(key, val, true);
  }, [updateMaterialSetting]);

  const handleMaterialUIUpdate = useCallback((key, val) => {
      if (key === 'environment') {
          React.startTransition(() => {
              if (val && val.startsWith('custom_')) {
                  const matched = savedHdrs.find(h => h.id === val || `custom_${h.id}` === val);
                  if (matched && matched.url) {
                      setMaterialSettings(prev => {
                          const nextMaps = { ...(prev.maps || {}), envMap: matched.url };
                          return {
                              ...prev,
                              environment: val,
                              customEnvMap: matched.url,
                              maps: nextMaps
                          };
                      });
                      saveToDB('active_hdr_id', matched.id);
                      return;
                  }
              }
              // Standard preset (studio, city, etc.)
              updateMaterialSetting(key, val, false);
          });
      } else {
          updateMaterialSetting(key, val, false);
      }
  }, [updateMaterialSetting, savedHdrs]);

  const handleDeleteHdr = useCallback(async (hdrId) => {
    try {
      const existingHdrs = (await getFromDB('saved_hdrs')) || [];
      const updated = existingHdrs.filter(h => h.id !== hdrId && `custom_${h.id}` !== hdrId);
      await saveToDB('saved_hdrs', updated);
      setSavedHdrs(prev => prev.filter(h => h.id !== hdrId && `custom_${h.id}` !== hdrId));

      setMaterialSettings(prev => {
        if (prev.environment === hdrId || prev.environment === `custom_${hdrId}`) {
          const nextMaps = { ...(prev.maps || {}) };
          delete nextMaps.envMap;
          saveToDB('active_hdr_id', null);
          return {
            ...prev,
            environment: 'studio',
            customEnvMap: null,
            maps: nextMaps
          };
        }
        return prev;
      });
    } catch (e) {
      console.warn("[ThreedEditor] Error deleting HDR:", e);
    }
  }, []);

  const handleMapUpload = useCallback(async (mapType, file) => {
    if (mapType === 'envMap') {
      if (file === null) {
        setMaterialSettings(prev => {
          const nextMaps = { ...(prev.maps || {}) };
          delete nextMaps.envMap;
          const next = { 
            ...prev, 
            customEnvMap: null, 
            environment: 'studio', 
            maps: nextMaps 
          };
          commitHistoryNow(buildSnapshot({
            materialSettings: next
          }));
          return next;
        });
        saveToDB('active_hdr_id', null);
        return;
      }

      const ext = file.name.split('.').pop().toLowerCase();
      const isHDREXR = ext === 'hdr' || ext === 'exr';
      const url = URL.createObjectURL(file) + (isHDREXR ? `#.${ext}` : '');
      const hdrId = `custom_${Date.now()}`;
      const newHdr = {
        id: hdrId,
        name: file.name,
        file: file,
        url: url,
        date: Date.now()
      };

      try {
        const existingHdrs = (await getFromDB('saved_hdrs')) || [];
        const updated = [newHdr, ...existingHdrs.filter(h => h.name !== file.name)].slice(0, 15);
        await saveToDB('saved_hdrs', updated);
        await saveToDB('active_hdr_id', hdrId);
        setSavedHdrs(updated);
      } catch (e) {
        console.warn("[ThreedEditor] Could not save HDR to IndexedDB:", e);
      }

      setMaterialSettings(prev => {
        const nextMaps = { ...(prev.maps || {}), envMap: url };
        const next = { 
          ...prev, 
          customEnvMap: url, 
          environment: hdrId, 
          maps: nextMaps 
        };
        commitHistoryNow(buildSnapshot({
          materialSettings: next
        }));
        return next;
      });
      return;
    }

    if (file === null) {
      setMaterialSettings(prev => {
        const nextMaps = { ...(prev.maps || {}), [mapType]: null };
        const next = { ...prev, maps: nextMaps, useFactorColor: true, lastChangedProp: 'maps' };
        
        commitHistoryNow(buildSnapshot({
            materialSettings: next
        }));
        
        return next;
      });
      return;
    }

    const ext = file.name.split('.').pop().toLowerCase();
    const isHDREXR = ext === 'hdr' || ext === 'exr';
    const url = URL.createObjectURL(file) + (isHDREXR ? `#.${ext}` : '');
    
    setMaterialSettings(prev => {
        const nextMaps = { ...(prev.maps || {}), [mapType]: url };
        let next = { ...prev, maps: nextMaps, useFactorColor: true, lastChangedProp: 'maps' };
        
        // Set default texture scale to 50% when applying a map manually
        if (mapType === 'map' || !prev.maps?.map) next.scale = 50;
        
        // Auto-set factors to 100% for maps that are multipliers (Standard Material behavior)
        if (mapType === 'map') next.color = '#ffffff';
        if (mapType === 'metalnessMap') next.metallic = 100;
        if (mapType === 'roughnessMap') next.roughness = 100;
        if (mapType === 'normalMap') next.normal = 100;
        if (mapType === 'bumpMap') next.bump = 100;
        if (mapType === 'aoMap') next.ao = 100;

        commitHistoryNow(buildSnapshot({
            materialSettings: next
        }));
        
        return next;
    });
  }, [commitHistoryNow, buildSnapshot]);

  const handleScreenshotClick = useCallback(() => {
    setIsScreenshotOpen(true);
  }, []);


  const handleDownloadScreenshot = () => {
    if (screenshotPreview) {
        const link = document.createElement('a');
        link.href = screenshotPreview;
        link.download = `3d-model-snapshot-${Date.now()}.png`;
        link.click();
        setIsScreenshotOpen(false);
    }
  };

  const processFile = async (file) => {
    if (!file) return;

    const name = file.name.toLowerCase();
    const validExtensions = ['.glb', '.gltf', '.obj', '.fbx', '.stl', '.step', '.stp', '.3ds', '.lwo', '.low', '.iges', '.igs', '.zip', '.rar', '.7z', '.tar', '.gz', '.tgz', '.bz2'];
    
    if (!validExtensions.some(ext => name.endsWith(ext))) {
        setFormatErrorModal({
            isOpen: true,
            title: "Unsupported File Format",
            message: `The file format ".${name.split('.').pop()}" is not supported. Please upload one of the following: ${validExtensions.map(e => e.toUpperCase().replace('.', '')).join(', ')}`
        });
        return;
    } 

    const legacyFbxVer = await checkFbxLegacyVersion(file);
    if (legacyFbxVer) {
        setFormatErrorModal({
            isOpen: true,
            title: `Legacy FBX Format (${legacyFbxVer === 6100 ? "FBX 6.1" : `v${legacyFbxVer}`})`,
            message: `This FBX model was exported using legacy Autodesk FBX ${legacyFbxVer === 6100 ? '6.1 (FileVersion: 6100)' : `v${legacyFbxVer}`} (pre-2011 binary format).\n\nModern 3D web engines (Three.js / WebGL) and Assimp require modern binary FBX 7.1+ (2013-2020) or .GLB / glTF.\n\nHow to fix:\n1. Open your model in Blender, Maya, 3ds Max, or Cinema 4D.\n2. Go to File > Export > FBX.\n3. In export settings, select modern FBX (2014-2020 binary) or export directly as .GLB / glTF.\n4. Upload the newly exported file.`
        });
        return;
    }

    const modelId = Date.now().toString();
    const ext = name.split('.').pop();
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);

    startModelLoading({
        id: modelId,
        name: file.name,
        size: `${sizeInMB} MB`,
        type: ext
    });

    try {
        const converted = await convertModelFileIfNeeded(file);

        setModelStats({ fileSize: `${converted.sizeInMB} MB` });

        if (models.length > 0) {
            models.forEach(m => {
                if (m.url && m.url.startsWith('blob:')) URL.revokeObjectURL(m.url);
            });
        }

        const newModel = {
            id: modelId,
            url: converted.url,
            file: converted.file,
            type: converted.type || 'glb',
            name: converted.name
        };

        const nextModels = [newModel];
        setModels(nextModels);
        
        // Kept for backward compat
        setModelUrl(converted.url);
        setModelFile(converted.file);
        setModelType(converted.type || 'glb');
        const nextModelName = newModel.name;
        setModelName(nextModelName);
        
        setModelMaterialLists({});
        setModelStatsMap({});
        setSelectedMaterial({ name: nextModelName, parentGroup: nextModelName });
        setHiddenMaterials(new Set());
        setDeletedMaterials(new Set());
        
        const nextMaterialSettings = {
            alpha: 100, metallic: 0, roughness: 50, normal: 100, bump: 100, scale: 100, scaleY: 100, rotation: 0,
            specular: 50, reflection: 50, shadow: 50, softness: 50, ao: 100, environment: 'studio',
            worldOpacity: 0, worldBlur: 0,
            color: '#ffffff', useFactorColor: false, autoUnwrap: false, envRotation: 0, offset: { x: 0, y: 0 },
            appliedTexture: null,
            maps: {},
            emissiveIntensity: 0,
            emissiveColor: '#ffffff',
            lightPosition: { x: 10, y: 10, z: 10 }
        };
        // Reset material settings for the new model
        setMaterialSettings(nextMaterialSettings);

        // Clear previous model hotspots & labels
        setHotspots([]);
        setActiveHotspotId(null);
        setEditingHotspot(null);
        setShowHotspotModal(false);
        setIsPlacingHotspot(false);
        isPlacingHotspotRef.current = false;
        setRightPanelMode('edit');
        
        setThreedState(prev => ({
            ...prev,
            models: nextModels,
            modelUrl: converted.url,
            modelName: nextModelName,
            hotspots: []
        }));

        commitHistoryNow(buildSnapshot({
            models: nextModels,
            modelName: nextModelName,
            materialSettings: nextMaterialSettings,
            hiddenMaterials: [],
            deletedMaterials: [],
            selectedMaterial: { name: nextModelName, parentGroup: nextModelName },
            modelMaterialLists: {},
            hotspots: []
        }));

        setIsSidebarCollapsed(false); 
        startMountingBridgeTicker(loadingProgressRef.current);
        // NOTE: Loader remains active while Three.js mounts and GenericModel base positioning calls handleModelReady!
    } catch (err) {
        console.error("Error processing/converting 3D model:", err);
        clearAllLoadingTimers();
        setManualLoading(false);
        loadingProgressRef.current = 0;
        setLoadingProgress(0);
        setLoadingText("");
        setLoadingModelInfo(null);
        pendingModelIdRef.current = null;
        isCompletingRef.current = false;
        
        const errMsg = err.response?.data?.message || err.message || "Failed to process 3D model";
        if (errMsg.includes("6100") || errMsg.includes("legacy FBX") || errMsg.includes("FileVersion")) {
            setFormatErrorModal({
                isOpen: true,
                title: "Legacy FBX Format (FileVersion: 6100)",
                message: errMsg
            });
        } else {
            toast.error(errMsg);
        }
    }
  };

  const handleSelectGalleryModel = async (model) => {
    if (!model) return;

    const modelId = model.modelId || Date.now().toString();
    startModelLoading({
        id: modelId,
        name: model.name,
        size: model.size || "Unknown",
        type: model.type || 'glb'
    });

    const activeBackendUrl = backendUrl || (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000').trim().replace(/\/+$/, '');
    const rawUrl = (model.url && (model.url.startsWith('http://') || model.url.startsWith('https://')))
      ? model.url
      : `${activeBackendUrl}${model.url.startsWith('/') ? '' : '/'}${model.url}`;
    const fullUrl = resolveUploadsPath(rawUrl);

    // Fetch freshest model details including hotspots from database if modelId exists
    let modelHotspots = Array.isArray(model.hotspots) ? model.hotspots : [];
    if (model.modelId) {
        try {
            const detailRes = await axios.get(`${activeBackendUrl}/api/3d-models/get-model/${model.modelId}`);
            if (detailRes.data && Array.isArray(detailRes.data.hotspots)) {
                modelHotspots = detailRes.data.hotspots;
            }
        } catch (detailErr) {
            console.warn("Could not fetch detailed model metadata:", detailErr);
        }
    }

    // Clear existing models if we are 'replacing'
    if (models.length > 0) {
        models.forEach(m => {
            if (m.url && m.url.startsWith('blob:')) URL.revokeObjectURL(m.url);
        });
    }

    const newModel = {
        id: modelId,
        modelId: model.modelId || modelId,
        url: fullUrl,
        file: null, // No local file object
        type: model.type,
        name: model.name.replace(/\.[^/.]+$/, ""),
        hotspots: modelHotspots
    };

    const nextModels = [newModel];
    setModels(nextModels);
    
    setModelUrl(fullUrl);
    setModelFile(null);
    setModelType(newModel.type);
    const nextModelName = newModel.name;
    setModelName(nextModelName);
    
    setModelMaterialLists({});
    setModelStatsMap({});
    setSelectedMaterial({ name: nextModelName, parentGroup: nextModelName });
    setHiddenMaterials(new Set());
    setDeletedMaterials(new Set());
    setModelStats({ fileSize: model.size || "0 MB" });

    const nextMaterialSettings = {
        alpha: 100, metallic: 0, roughness: 50, normal: 100, bump: 100, scale: 100, scaleY: 100, rotation: 0,
        specular: 50, reflection: 50, shadow: 50, softness: 50, ao: 100, environment: 'studio',
        worldOpacity: 0, worldBlur: 0,
        color: '#ffffff', useFactorColor: false, autoUnwrap: false, envRotation: 0, offset: { x: 0, y: 0 },
        appliedTexture: null,
        lightPosition: { x: 10, y: 10, z: 10 }
    };
    setMaterialSettings(nextMaterialSettings);

    // Restore hotspots from the selected gallery model!
    setHotspots(modelHotspots);
    setActiveHotspotId(null);
    setEditingHotspot(null);
    setShowHotspotModal(false);
    setIsPlacingHotspot(false);
    isPlacingHotspotRef.current = false;
    
    setThreedState(prev => ({
        ...prev,
        models: nextModels,
        modelUrl: fullUrl,
        modelName: nextModelName,
        hotspots: modelHotspots
    }));

    commitHistoryNow(buildSnapshot({
        models: nextModels,
        modelName: nextModelName,
        materialSettings: nextMaterialSettings,
        hiddenMaterials: [],
        deletedMaterials: [],
        selectedMaterial: { name: nextModelName, parentGroup: nextModelName },
        modelMaterialLists: {},
        hotspots: modelHotspots
    }));

    setIsSidebarCollapsed(false);
    startMountingBridgeTicker(loadingProgressRef.current);
    
    // Update URL to the new model ID
    if (model.modelId) {
        navigate(`/editor/threed_editor/${model.modelId}`);
    }
  };


  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const dropResult = await process3DDropEvent(e.dataTransfer, {
        onProgressText: (txt) => {
          setLoadingText(txt);
          setManualLoading(true);
        }
      });
      if (dropResult?.file) {
        processFile(dropResult.file);
      }
    } catch (err) {
      console.warn("Drop processing fallback:", err.message);
      const file = e.dataTransfer?.files?.[0];
      if (file) processFile(file);
    }
  };

  const handleClearModel = async () => {
    // Revoke URLs
    models.forEach(m => {
         if (m.url) URL.revokeObjectURL(m.url);
    });

    clearAllLoadingTimers();
    setManualLoading(false);
    loadingProgressRef.current = 0;
    setLoadingProgress(0);
    setLoadingText("");
    setLoadingModelInfo(null);
    pendingModelIdRef.current = null;
    isCompletingRef.current = false;

    const defaultTransform = {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 }
    };

    setModels([]);
    setModelUrl(null);
    setModelFile(null); 
    setModelType('glb');
    setMaterialList([]);
    setModelMaterialLists({});
    setModelStatsMap({});
    setModelHasAnimationsMap({});
    setIsAnimationPlaying(true);
    setSelectedMaterial(null);
    setModelName("");
    setSelectedTexture(null);
    setIsSidebarCollapsed(true);
    
    // Clear 3D model scene refs & URL ID
    if (modelRefs.current) modelRefs.current.clear();
    if (modelRef.current) modelRef.current = null;
    navigate("/editor/threed_editor", { replace: true });

    setModelStats({
        vertexCount: "0",
        polygonCount: "0",
        materialCount: "0",
        fileSize: "0 MB",
        dimensions: "0 X 0 X 0 unit"
    });
    setTransformValues(defaultTransform);
    setHiddenMaterials(new Set());
    setDeletedMaterials(new Set());
    
    // Clear 3D Hotspots & Labels
    setHotspots([]);
    setActiveHotspotId(null);
    setEditingHotspot(null);
    setShowHotspotModal(false);
    setIsPlacingHotspot(false);
    isPlacingHotspotRef.current = false;
    setRightPanelMode('edit');
    localStorage.removeItem('tempThreedEditModel');
    
    // Reset Context State
    setThreedState(prev => ({
        ...prev,
        models: [],
        modelUrl: null,
        modelName: "",
        hotspots: [],
        materialSettings: {
            alpha: 100, metallic: 0, roughness: 50, normal: 100, bump: 100, scale: 100, scaleY: 100, rotation: 0,
            specular: 50, reflection: 50, shadow: 50, softness: 50, ao: 100, environment: 'studio',
            worldOpacity: 0, worldBlur: 0,
            color: '#ffffff', useFactorColor: false, autoUnwrap: false, envRotation: 0, offset: { x: 0, y: 0 },
            lightPosition: { x: 10, y: 10, z: 10 }
        }
    }));

    // Reset undo/redo history completely
    resetHistory({
        models: [],
        modelName: "",
        transformValues: defaultTransform,
        materialSettings: {
            alpha: 100, metallic: 0, roughness: 50, normal: 100, bump: 100, scale: 100, scaleY: 100, rotation: 0,
            specular: 50, reflection: 50, shadow: 50, softness: 50, ao: 100, environment: 'studio',
            worldOpacity: 0, worldBlur: 0,
            color: '#ffffff', useFactorColor: false, autoUnwrap: false, envRotation: 0, offset: { x: 0, y: 0 },
            lightPosition: { x: 10, y: 10, z: 10 }
        },
        hiddenMaterials: [],
        deletedMaterials: [],
        selectedMaterial: null,
        selectedTexture: null,
        modelMaterialLists: {},
        hotspots: []
    });

    lastSavedRef.current = {
      historyIndex: 0,
      hasLocalFiles: false
    };
    setHasUnsavedChanges(false);

    // Also clear from server session to make it persistent across refreshes
    try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const user = JSON.parse(storedUser);
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
            await axios.post(`${backendUrl}/api/3d-models/save-session`, {
                emailId: user.emailId,
                state: {
                    models: [],
                    materialSettings: {},
                    transformValues: defaultTransform,
                    modelName: "",
                    hotspots: [],
                    lastSaved: new Date().toISOString()
                }
            });
        }
    } catch (err) {
        console.error("Error clearing server session:", err);
    }
  };

  const handleResetView = () => {
    if (typeof frameModelFullViewRef.current === 'function') {
      frameModelFullViewRef.current(latestModelBoundsRef.current, true);
    } else if (controlsRef.current) {
      controlsRef.current.reset();
      setTargetPosition({ x: 0, y: 0, z: 0 });
    }
    const defaultTransform = {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 }
    };
    setTransformValues(defaultTransform);

    meshTransformsRef.current = {};
    setMeshTransformsState({});

    // Trigger scene-wide reset for model parts
    setSceneResetTrigger(prev => prev + 1);

    commitHistoryNow(buildSnapshot({
        transformValues: defaultTransform,
        meshTransforms: {}
    }));
  };

  const handleManualTransformChange = (type, axis, value, isDragging = false) => {
    setTransformValues(prev => {
        const next = { ...prev };
        
        let numVal = parseFloat(value);
        if (isNaN(numVal)) return prev; 

        // Rotation: Input is Degrees, Store as Radians
        if (type === 'rotation') {
            numVal = numVal * (Math.PI / 180);
        }

        next[type] = {
            ...prev[type],
            [axis]: numVal
        };

        let nextMeshTransforms = meshTransformsRef.current ? { ...meshTransformsRef.current } : {};
        const isChildSelection = selectedMaterial && selectedMaterial.name !== modelName && selectedMaterial.name !== 'Scene';
        if (isChildSelection) {
            const targetUuid = selectedMaterial.uuid || selectedMaterial.meshUuid;
            if (targetUuid) {
                const prevMTransform = nextMeshTransforms[targetUuid] || {
                    position: { ...(next.position || { x: 0, y: 0, z: 0 }) },
                    rotation: { ...(next.rotation || { x: 0, y: 0, z: 0 }) },
                    scale: { ...(next.scale || { x: 1, y: 1, z: 1 }) }
                };
                nextMeshTransforms[targetUuid] = {
                    ...prevMTransform,
                    [type]: {
                        ...prevMTransform[type],
                        [axis]: numVal
                    }
                };
                meshTransformsRef.current = nextMeshTransforms;
                setMeshTransformsState(nextMeshTransforms);
            }
        }
        
        const snapshot = buildSnapshot({ transformValues: next, meshTransforms: nextMeshTransforms });
        if (isDragging) {
            commitHistoryDebounced(snapshot, 300);
        } else {
            commitHistoryNow(snapshot);
        }
        
        return next;
    });
  };


  const [sceneResetTrigger, setSceneResetTrigger] = useState(0);
  const [uvUnwrapTrigger, setUvUnwrapTrigger] = useState(0);

  const handleResetTransform = (type) => {
    if (type === 'all') {
        setSceneResetTrigger(prev => prev + 1);
    }

    setTransformValues(prev => {
        const next = { ...prev };
        
        // Use stored original values if available, otherwise default to 0/0/0
        const defaults = originalTransformRef.current || {
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 }
        };

        const getXYZ = (obj) => ({ x: obj.x, y: obj.y, z: obj.z });

        if (!type || type === 'all') {
             next.position = getXYZ(defaults.position);
             next.rotation = getXYZ(defaults.rotation);
             next.scale = getXYZ(defaults.scale);
        } else if (type === 'position') {
             next.position = getXYZ(defaults.position);
        } else if (type === 'rotation') {
             next.rotation = getXYZ(defaults.rotation);
        } else if (type === 'scale') {
             next.scale = getXYZ(defaults.scale);
        }
        
        commitHistoryNow(buildSnapshot({ transformValues: next }));

        return next;
    });
  };
  
  const handleTransformStart = useCallback(() => {
     if (historyDebounceTimerRef.current) {
         clearTimeout(historyDebounceTimerRef.current);
         historyDebounceTimerRef.current = null;
         commitHistoryNow();
     }
     if (controlsRef.current) {
         controlsRef.current.enabled = false;
     }
  }, [commitHistoryNow]);

  const handleTransformEnd = useCallback((finalMeshTransforms) => {
     if (controlsRef.current) {
         controlsRef.current.enabled = true;
     }
     try {
         let nextTransforms = { ...meshTransformsRef.current };
         if (finalMeshTransforms && typeof finalMeshTransforms === 'object') {
             nextTransforms = {
                 ...nextTransforms,
                 ...finalMeshTransforms
             };
             meshTransformsRef.current = nextTransforms;
             setMeshTransformsState(nextTransforms);
         }
         commitHistoryNow(buildSnapshot({ meshTransforms: nextTransforms }));
     } catch (err) {
         console.warn("[ThreedEditor] Error during transform end history snapshot:", err);
     }
  }, [commitHistoryNow, buildSnapshot]);

  const [settings, setSettings] = useState({
    backgroundColor: "#393939", // Blender default dark grey
    baseColor: "#2c2c2c",
    base: false,
    grid: true,
    wireframe: false,
  });

  // Memoized Handlers to prevent infinite loops in child Effects
  const handleTextureIdentified = useCallback((id) => {
      setSelectedTextureId(prev => prev === id ? prev : id);
  }, []);

   const handleTextureApplied = useCallback(() => {
       // Clear selectedTexture after it's applied so it doesn't bleed to other materials
       setSelectedTexture(null);
   }, []);

   const handleSelectTexture = useCallback((textureData) => {
       const isReset = !textureData || !textureData.id;
       const isNone = textureData?.id === 'none';
       const newTexture = isReset ? null : { ...textureData, ts: Date.now() };
       const newTextureId = isReset ? null : textureData.id;
       
       setSelectedTextureId(newTextureId);
       setSelectedTexture(newTexture);

       setMaterialSettings(prev => {
           const next = {
               ...prev,
               appliedTexture: newTexture
           };

           if (isReset || isNone) {
               next.maps = { 
                   map: null, 
                   normalMap: null, 
                   roughnessMap: null, 
                   metalnessMap: null, 
                   displacementMap: null, 
                   aoMap: null,
                   emissiveMap: null,
                   alphaMap: null,
                   ...(prev.customEnvMap || prev.maps?.envMap ? { envMap: prev.customEnvMap || prev.maps?.envMap } : {})
               };
               next.lastChangedProp = 'maps';
           } else {
               // Resolve URLs and Map Keys for Uploaded Textures
               let finalMaps = { ...(textureData.maps || {}) };
               
               if (textureData.isUploaded) {
                   const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
                   const keyMapping = {
                       base: 'map',
                       metallic: 'metalnessMap',
                       roughness: 'roughnessMap',
                       normal: 'normalMap',
                       ao: 'aoMap',
                       displacement: 'displacementMap',
                       opacity: 'alphaMap',
                       emissive: 'emissiveMap'
                   };

                   const mapped = {};
                   Object.entries(finalMaps).forEach(([key, url]) => {
                       if (!url) return;
                       const targetKey = keyMapping[key] || key;
                       const fullUrl = resolveUploadsPath(url);
                       mapped[targetKey] = fullUrl;
                   });
                   finalMaps = mapped;
               }

               next.maps = { 
                   ...(prev.maps || {}), 
                   ...finalMaps,
                   ...(prev.customEnvMap || prev.maps?.envMap ? { envMap: prev.customEnvMap || prev.maps?.envMap } : {})
               };
               // Set factors to 100% when applying a full texture set
               next.metallic = 100;
               next.roughness = 100;
               next.normal = 100;
               next.bump = 0;
               next.ao = 100;
               next.color = '#ffffff';
               next.scale = 50;
               next.useFactorColor = true;
               next.lastChangedProp = 'appliedTexture';
           }

           commitHistoryNow(buildSnapshot({
               materialSettings: next,
               selectedTexture: newTexture,
               selectedTextureId: newTextureId
           }));

           return next;
       });
   }, [commitHistoryNow, buildSnapshot]);

  const handleSelectMaterial = useCallback((val) => {
      setSelectedTexture(null);
      
      const getNames = (s) => {
          if (!s) return [];
          if (typeof s === 'string') return [s];
          if (Array.isArray(s.materials)) {
              return s.materials.map(m => typeof m === 'string' ? m : (m?.name || m?.material || '')).filter(Boolean);
          }
          if (typeof s === 'object' && s.name) {
              return [typeof s.name === 'string' ? s.name : (s.name?.name || '')].filter(Boolean);
          }
          return [];
      };

      // Ensure we have an object for the new selection with clean string name
      const target = typeof val === 'object' ? { ...val } : { name: val };
      if (target.name && typeof target.name !== 'string') {
          target.name = target.name.name || target.name.material || String(target.name);
      }
      const isShift = !!target.isShift;

      // Interactive Hotspot Placement Mode: user clicked a point on the model to place a hotspot
      if (isPlacingHotspotRef.current) {
          setIsPlacingHotspot(false);
          isPlacingHotspotRef.current = false;
          setEditingHotspot(null);
          setSelectedMaterial({
              ...target,
              uuid: target.uuid || target.meshUuid || null,
              meshUuid: target.meshUuid || target.uuid || null,
              clickPoint: target.clickPoint || null,
              clickNormal: target.clickNormal || null
          });
          setShowHotspotModal(true);
          return;
      }

      // Optimization: If clicking the same mesh/material and not holding shift, ignore to prevent re-renders/stutter
      if (!isShift && selectedMaterial && !selectedMaterial.isGroup && selectedMaterial.name === target.name && (!target.uuid || selectedMaterial.uuid === target.uuid)) {
          return;
      }

      // Multi-selection with toggle behavior
      setSelectedMaterial(prev => {
          if (isShift && prev) {
              // Extract existing items from prev selection
              let prevItems = [];
              if (Array.isArray(prev.items) && prev.items.length > 0) {
                  prevItems = [...prev.items];
              } else if (prev.uuid || prev.meshUuid) {
                  prevItems = [{
                      uuid: prev.uuid || prev.meshUuid,
                      meshUuid: prev.meshUuid || prev.uuid,
                      name: prev.name,
                      meshName: prev.meshName || prev.name,
                      material: prev.material,
                      isMesh: true
                  }];
              } else if (Array.isArray(prev.materials)) {
                  prevItems = prev.materials.map(m => ({
                      name: typeof m === 'string' ? m : (m?.name || ''),
                      material: typeof m === 'string' ? m : (m?.material || m?.name || ''),
                      isMesh: false
                  }));
              } else if (prev.name) {
                  prevItems = [{ name: prev.name, isMesh: false }];
              }

              const targetUuid = target.uuid || target.meshUuid || null;
              const targetName = target.meshName || target.name || null;

              // Check if target is already in the selection (by UUID or name)
              const existingIdx = prevItems.findIndex(it => {
                  const itUuid = it.uuid || it.meshUuid;
                  if (targetUuid && itUuid) return itUuid === targetUuid;
                  const itName = it.meshName || it.name;
                  if (targetName && itName) return itName === targetName;
                  return false;
              });

              let nextItems = [];
              if (existingIdx >= 0) {
                  // REMOVE (toggle off)
                  nextItems = prevItems.filter((_, idx) => idx !== existingIdx);
              } else {
                  // ADD (toggle on)
                  nextItems = [
                      ...prevItems,
                      {
                          uuid: targetUuid,
                          meshUuid: targetUuid,
                          name: target.name,
                          meshName: target.meshName || target.name,
                          material: target.material,
                          isMesh: true
                      }
                  ];
              }

              if (nextItems.length === 0) return null;
              if (nextItems.length === 1) {
                  return {
                      ...nextItems[0],
                      ts: Date.now()
                  };
              }

              const allUuids = Array.from(new Set(nextItems.map(it => it.uuid || it.meshUuid).filter(Boolean)));
              const allMeshNames = Array.from(new Set(nextItems.map(it => it.meshName || it.name).filter(Boolean)));
              const allMaterials = Array.from(new Set(nextItems.map(it => typeof it.material === 'string' ? it.material : it.material?.name).filter(Boolean)));

              return {
                  name: "Multiple Selection",
                  isGroup: true,
                  isMultiSelect: true,
                  items: nextItems,
                  uuids: allUuids,
                  meshNames: allMeshNames,
                  materials: allMaterials,
                  ts: Date.now()
              };
          }
          
          return { ...target, uuid: target.uuid || target.meshUuid || null, meshUuid: target.meshUuid || target.uuid || null, ts: Date.now() };
      });

      // If user is actively using 3D transform tools, selecting a mesh is strictly for 3D transformation
      // Do NOT overwrite material settings or texture placement
      if (transformModeRef.current || target.isTransformSelect) {
          return;
      }

      // Clear property specific maps first to prevent bleeding, then check for defaults
      setMaterialSettings(prev => {
          const preservedEnvMap = prev.customEnvMap || prev.maps?.envMap || null;
          const next = { 
              ...prev, 
              maps: preservedEnvMap ? { envMap: preservedEnvMap } : {}, 
              customEnvMap: preservedEnvMap, 
              useFactorColor: false, 
              lastChangedProp: null 
          };
          
          // If it's a single material selection, try to fetch default textures/properties from the model.
          // Skip lookup when target is a model-level selection (model name clicked in the list).
          const isModelLevelSelection = models.some(m => m.name === target.name);
          if (!isShift && target.name && !isModelLevelSelection && target.name !== "Scene") {
              // Find which model this material belongs to
              let defaultData = null;
              const lookupKeys = [target.uuid, target.meshUuid, target.name, target.material].filter(Boolean);
              for (const modelId in modelMaterialDataMap) {
                  const mData = modelMaterialDataMap[modelId];
                  if (!mData) continue;
                  for (const key of lookupKeys) {
                      if (mData[key]) {
                          defaultData = mData[key];
                          break;
                      }
                  }
                  if (defaultData) break;
              }

              if (defaultData) {
                  const cleanMaps = {};
                  if (defaultData.maps && typeof defaultData.maps === 'object') {
                      for (const [k, v] of Object.entries(defaultData.maps)) {
                          if (v) cleanMaps[k] = v;
                      }
                  }
                  // Merge freshMaps (extracted live at click time) over cached maps.
                  // freshMaps have real thumbnail DataURLs so they override any stale 'existing' sentinels.
                  if (target.freshMaps && typeof target.freshMaps === 'object') {
                      for (const [k, v] of Object.entries(target.freshMaps)) {
                          if (v && v !== 'existing') cleanMaps[k] = v;
                      }
                  }
                  return {
                      ...next,
                      color: defaultData.color || next.color,
                      metallic: defaultData.metallic !== undefined ? defaultData.metallic : next.metallic,
                      roughness: defaultData.roughness !== undefined ? defaultData.roughness : next.roughness,
                      alpha: defaultData.opacity !== undefined ? defaultData.opacity : next.alpha,
                      scale: prev.scale !== undefined ? prev.scale : (defaultData.scale !== undefined ? defaultData.scale : next.scale),
                      maps: { ...cleanMaps, ...(preservedEnvMap ? { envMap: preservedEnvMap } : {}) },
                      customEnvMap: preservedEnvMap,
                      useFactorColor: false,
                      lastChangedProp: null
                  };
              }

              // No cached defaultData found, but we may still have freshMaps from the click
              if (target.freshMaps && typeof target.freshMaps === 'object') {
                  const freshClean = {};
                  for (const [k, v] of Object.entries(target.freshMaps)) {
                      if (v && v !== 'existing') freshClean[k] = v;
                  }
                  if (Object.keys(freshClean).length > 0) {
                      return {
                          ...next,
                          maps: { ...freshClean, ...(preservedEnvMap ? { envMap: preservedEnvMap } : {}) },
                          customEnvMap: preservedEnvMap,
                          useFactorColor: false,
                          lastChangedProp: null
                      };
                  }
              }
          }
          
          return next;
      });

   }, [modelName, models, modelMaterialDataMap, selectedMaterial]);
   handleSelectMaterialRef.current = handleSelectMaterial;

  // Reset the override flag when selection changes.
  // This prevents the settings from one material (or a freshly synced baseline)
  // from being pushed back to the model before the user has actually touched a slider.
  useEffect(() => {
    if (isRestoringHistoryRef.current) {
        isRestoringHistoryRef.current = false;
        return;
    }
    setMaterialSettings(prev => ({
        ...prev,
        useFactorColor: false,
        lastChangedProp: null
    }));
    if (!selectedMaterial) {
        setTransformMode(null);
    }
  }, [selectedMaterial]);

  const handleTransformChange = useCallback((t) => {
      if (t.original) {
          originalTransformRef.current = t.original;
      } else {
          originalTransformRef.current = null;
      }
      
      const nextTransform = {
          position: { x: t.position.x, y: t.position.y, z: t.position.z },
          rotation: { x: t.rotation.x, y: t.rotation.y, z: t.rotation.z },
          scale: { x: t.scale.x, y: t.scale.y, z: t.scale.z }
      };

      setTransformValues(prev => {
          if (prev &&
              prev.position?.x === nextTransform.position.x &&
              prev.position?.y === nextTransform.position.y &&
              prev.position?.z === nextTransform.position.z &&
              prev.rotation?.x === nextTransform.rotation.x &&
              prev.rotation?.y === nextTransform.rotation.y &&
              prev.rotation?.z === nextTransform.rotation.z &&
              prev.scale?.x === nextTransform.scale.x &&
              prev.scale?.y === nextTransform.scale.y &&
              prev.scale?.z === nextTransform.scale.z) {
              return prev;
          }
          return nextTransform;
      });
  }, []);

  const canvasPointerDownPosRef = useRef(null);
  // Timestamp of the last hotspot-label click (Html overlay).
  // Used to prevent the Three.js pointerMissed handler from immediately clearing activeHotspotId
  // when the Html portal click leaks through to the canvas as a "missed" pointer event.
  const lastHotspotClickTimeRef = useRef(0);

  const handleCanvasPointerDown = useCallback((e) => {
    canvasPointerDownPosRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handlePointerMissed = useCallback((e) => {
    if (canvasPointerDownPosRef.current) {
      const dx = Math.abs(e.clientX - canvasPointerDownPosRef.current.x);
      const dy = Math.abs(e.clientY - canvasPointerDownPosRef.current.y);
      // If dragged more than 5px, it's a camera orbit/drag, not a click to unselect
      if (dx > 5 || dy > 5) return;
    }

    // Ignore if clicking on UI overlay controls
    if (e.target && e.target.closest && e.target.closest('.pointer-events-auto')) {
      return;
    }

    // Guard 1: hotspot label just clicked (Html overlay leaks to Three.js canvas as pointerMissed)
    if (Date.now() - lastHotspotClickTimeRef.current < 200) return;
    // Guard 2: camera is currently animating to the hotspot front view
    if (isHotspotFocusingRef.current) return;

    if (selectedMaterial) {
      setSelectedMaterial(null);
    }
  }, [selectedMaterial]);

  return (
    <div 
        className="flex h-[92vh] w-full bg-white overflow-hidden relative"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
    >
      {!showModelGalleryModal && (
        <GlobalLoader
          manualLoading={manualLoading || isSyncing}
          progress={loadingProgress}
          stage={loadingText}
          modelInfo={loadingModelInfo}
        />
      )}
      


      {/* --- EXPORT MODAL --- */}
      {showExportModal && (
          <Export3DModal 
              onClose={() => setShowExportModal(false)}
              onExport={handleExport}
              models={models}
              materialSettings={materialSettings}
              transformValues={transformValues}
              hiddenMaterials={hiddenMaterials}
              deletedMaterials={deletedMaterials}
              selectedTexture={selectedTexture}
              selectedMaterial={selectedMaterial}
              materialList={activeMaterialList}
              modelName={modelName}
              modelSize={modelStats.fileSize || "Unknown"}
          />
      )}

      <div className="flex flex-1 overflow-hidden relative">

        {/* CENTER EDITOR AREA */}
        <div className="flex-1 relative flex flex-col h-full overflow-hidden">

          {/* SIDEBARS & FLOATING PANELS */}
          {models.length > 0 && (
            <TopToolbar 
              isSidebarCollapsed={isSidebarCollapsed} 
              setIsSidebarCollapsed={setIsSidebarCollapsed}
              isTextureOpen={isTextureOpen}
              onReset={handleResetView}
              targetPosition={targetPosition}
              materialList={activeMaterialList}
              selectedMaterial={selectedMaterial}
              hiddenMaterials={hiddenMaterials}
              onSelectMaterial={(name) => handleSelectMaterial(name)}
              modelName={modelName || "Scene"} 
              onToggleVisibility={handleToggleVisibility}
              onDeleteMaterial={handleDeleteMaterial}
              onDeleteModel={handleDeleteModel}
              onRename={handleRename}
              onRenameMaterial={handleRenameMaterial}
              onUndo={handleUndo}
              onRedo={handleRedo}
              canUndo={canUndo}
              canRedo={canRedo}
            />
          )}


          <EditorToolbar
            hasModel={models.length > 0}
            selectedMaterial={selectedMaterial}
            settings={settings}
            setSettings={setSettings}
            onClear={handleClearModel}
            onAddClick={() => setShowAddModelModal(true)}
            onGalleryClick={() => setShowModelGalleryModal(true)}
            onScreenshotClick={handleScreenshotClick}
            isScreenshotOpen={isScreenshotOpen}
            transformMode={transformMode}
            setTransformMode={(mode) => {
                setTransformMode(mode);
                if (mode) {
                    setActiveAccordion("position");
                }
            }}
            hotspotCount={hotspots.length}
            activeHotspotId={activeHotspotId}
            rightPanelMode={rightPanelMode}
            onRightPanelModeChange={setRightPanelMode}
            onAddHotspotClick={() => {
              setRightPanelMode('hotspot');
            }}
          />

          {isScreenshotOpen && (
              <CameraModal
                  isOpen={isScreenshotOpen}
                  onClose={() => setIsScreenshotOpen(false)}
                  models={models}
                  settings={settings}
                  materialSettings={materialSettings}
                  transformValues={transformValues}
                  hiddenMaterials={hiddenMaterials}
                  deletedMaterials={deletedMaterials}
                  selectedMaterial={selectedMaterial}
                  selectedTexture={selectedTexture}
              />
          )}


          {models.length > 0 && (
            <TextureGalleryBar
              isOpen={isTextureOpen}
              setIsOpen={setIsTextureOpen}
              onSelectTexture={handleSelectTexture}
              selectedTextureId={selectedTextureId}
              onAddMaterialClick={() => setShowAddMaterialModal(true)}
              refreshTrigger={materialRefreshKey}
              onSelectColor={(colorData) => {
                  if (typeof colorData === 'object') {
                      setMaterialSettings(prev => {
                          const next = {
                              ...prev,
                              color: colorData.color || colorData.hex || prev.color,
                              metallic: colorData.metallic !== undefined ? colorData.metallic : prev.metallic,
                              roughness: colorData.roughness !== undefined ? colorData.roughness : prev.roughness,
                              normal: colorData.normal !== undefined ? colorData.normal : prev.normal,
                              ao: colorData.ao !== undefined ? colorData.ao : prev.ao,
                              bump: colorData.bump !== undefined ? colorData.bump : prev.bump,
                              emissiveColor: colorData.emissiveColor || '#000000',
                              emissiveIntensity: colorData.emissiveIntensity !== undefined ? colorData.emissiveIntensity : 0,
                              useFactorColor: true
                          };
                          commitHistoryNow(buildSnapshot({
                              materialSettings: next
                          }));
                          return next;
                      });
                  } else {
                      handleMaterialUIUpdate('color', colorData);
                  }
              }}
              selectedColor={materialSettings?.color}
            />
          )}

          {models.length > 0 && (
            <div
              className={`absolute left-[1vw] z-20 p-[0.25vw] transition-all duration-500 ease-in-out overflow-hidden w-[17vw] pointer-events-none select-none
                ${isTextureOpen ? "bottom-[13vw]" : "bottom-[3.7vw]"}
              `}
            >
                <EditorInfoBox stats={combinedStats} />
            </div>
          )}


          {models.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none select-none">
              <div className="flex flex-col items-center gap-[0.75vw] opacity-50">
                <Icon icon="ph:cube-focus-thin" width="4.16vw" className="text-gray-50" />
                <span className="text-[0.72vw] font-medium text-gray-50">Uploaded 3D Model will be shown here</span>
              </div>
            </div>
          )}

          {/* Dynamic sun position: accurately maps compass azimuth to 360° horizontal orbit around model */}
          {(() => {
            const rawX = materialSettings.lightPosition?.x ?? 10;
            const rawY = materialSettings.lightPosition?.y ?? 10;
            const rawZ = materialSettings.lightPosition?.z ?? 10;

            // Full 360° Sun Rotation Mapping:
            // Compass Pad / Steppers (Ground Plane & Height):
            // - rawX: East (+) / West (-)
            // - rawY: North (+) / South (-)
            // - rawZ: Height above ground
            // Three.js 3D Coordinate Space:
            // - X = rawX (East: +X, West: -X)
            // - Y = Math.max(1.5, rawZ) (Elevation/height above floor)
            // - Z = -rawY (North: -Z behind model, South: +Z in front of model)
            const sunX = Math.abs(rawX) < 0.001 && Math.abs(rawY) < 0.001 ? 0.01 : rawX;
            const sunY = Math.max(1.5, rawZ);
            const sunZ = -(Math.abs(rawX) < 0.001 && Math.abs(rawY) < 0.001 ? 0.01 : rawY);

            return (
              <div className={`flex-1 h-full w-full relative ${isPlacingHotspot ? "cursor-crosshair" : ""}`}>
                {!isSyncing && (
                  <Canvas
                    camera={{ position: [3.5, 3.2, 5.0], fov: 45, near: 0.05, far: 1000 }}
                    onPointerDown={handleCanvasPointerDown}
                    onPointerMissed={handlePointerMissed}
                    dpr={[1, 1.5]}
                    gl={{
                      preserveDrawingBuffer: true,
                      antialias: true,
                      alpha: true,
                      powerPreference: "high-performance"
                    }}
                    shadows={{ type: THREE.PCFShadowMap }}
                    onCreated={({ gl, camera }) => {
                      glInstanceRef.current = gl;
                      cameraInstanceRef.current = camera;
                      gl.shadowMap.enabled = true;
                      gl.shadowMap.type = THREE.PCFShadowMap;
                      gl.toneMapping = THREE.ACESFilmicToneMapping;
                      gl.outputColorSpace = THREE.SRGBColorSpace;
                    }}
                  >
                    {/* Capturing mode transparent background check */}
                    {isCapturing && <color attach="background" args={['transparent']} />}

                    {/* Ambient: balanced with shadow slider so high shadow gives rich contrast */}
                    <ambientLight intensity={0.4 + (100 - (materialSettings.shadow ?? 50)) / 250} />

                    {/* Primary Sun Directional Light: casts realistic dynamic shadows with responsive softness */}
                    <DirectionalSunLight
                      position={[sunX, sunY, sunZ]}
                      specular={materialSettings.specular}
                      softness={materialSettings.softness}
                    />

                    {/* Secondary Fill Light: soft fill to prevent pitch-black ambient shadow without opposing shadow */}
                    <directionalLight
                      position={[-sunX * 0.4, Math.max(sunY * 0.6, 4), -sunZ * 0.4]}
                      intensity={0.35}
                      castShadow={false}
                    />

              <Suspense fallback={null}>
                <group ref={sceneWrapperRef}>
                  {models.map((model, index) => (
                    <RenderModel
                        key={model.id}
                        ref={(r) => {
                            if (index === 0) modelRef.current = r;
                            if (r) modelRefs.current.set(model.id, r);
                            else modelRefs.current.delete(model.id);
                        }}
                        type={model.type}
                        url={model.url}
                        wireframe={settings.wireframe}
                        xrayMode={xrayMode}
                        setModelStats={(stats) => handleSetModelStats(model.id, stats)}
                        setMaterialList={(list, dataMap) => handleSetMaterialList(model.id, list, dataMap)}
                        selectedMaterial={selectedMaterial}
                        onSelectMaterial={handleSelectMaterial}
                        activeHotspotMeshUuid={hotspots.find(h => h.id === activeHotspotId)?.meshUuid || null}
                        activeHotspotMeshName={hotspots.find(h => h.id === activeHotspotId)?.meshName || null}
                        modelName={model.name}
                        transformMode={transformMode}
                        transformValues={transformValues}
                        meshTransforms={meshTransformsState}
                        materialSettings={materialSettings}
                        hiddenMaterials={hiddenMaterials}
                        deletedMaterials={deletedMaterials}
                        onUpdateMaterialSetting={handleMaterialSync}
                        selectedTexture={selectedTexture}
                        resetKey={resetKey}
                        sceneResetTrigger={sceneResetTrigger}
                        uvUnwrapTrigger={uvUnwrapTrigger}
                        onTextureApplied={handleTextureApplied}
                        onTextureIdentified={handleTextureIdentified}
                        onTransformStart={handleTransformStart}
                        onTransformEnd={handleTransformEnd}
                        onTransformChange={handleTransformChange}
                        onModelReady={(bounds) => handleModelReady(model.id, bounds)}
                        onProgress={(pct, stage) => handleModelProgress(model.id, pct, stage)}
                        isAnimationPlaying={isAnimationPlaying}
                        onHasAnimationsChange={(hasAnim) => handleHasAnimationsChange(model.id, hasAnim)}
                    />
                  ))}
                </group>

                {transformMode && (selectedMaterial?.name === "Scene") && (
                    <TransformControls
                        object={sceneWrapperRef.current}
                        mode={transformMode}
                        size={0.8}
                        onMouseDown={handleTransformStart}
                        onChange={() => {
                            if (handleTransformChange && sceneWrapperRef.current) {
                                handleTransformChange({
                                    position: sceneWrapperRef.current.position,
                                    rotation: sceneWrapperRef.current.rotation,
                                    scale: sceneWrapperRef.current.scale
                                });
                            }
                        }}
                        onMouseUp={handleTransformEnd}
                    />
                )}

              </Suspense>

              {/* Blender-style Infinite Procedural Grid with Horizon Fade & Integrated Axes */}
              {settings.grid && !isCapturing && (
                <BlenderInfiniteGrid />
              )}

              {/* DYNAMIC SUN SHADOW CATCHER PLANE: 
                  When base is disabled (default / grid view), this transparent plane receives the dynamic sun shadow directly on the grid/floor.
                  Placed at Y = -0.003 with polygonOffset so it never z-fights or overlays false shadows on model floors at Y = 0.
              */}
              {!settings.base && !isCapturing && (
                <mesh 
                  rotation={[-Math.PI / 2, 0, 0]} 
                  position={[0, -0.003, 0]} 
                  receiveShadow
                  onClick={(e) => {
                    // If a model mesh was clicked in front of the ground plane, do not clear selection
                    if (e.intersections && e.intersections.length > 0 && e.intersections[0].object !== e.object) {
                      return;
                    }
                    if (canvasPointerDownPosRef.current) {
                      const dx = Math.abs(e.clientX - canvasPointerDownPosRef.current.x);
                      const dy = Math.abs(e.clientY - canvasPointerDownPosRef.current.y);
                      if (dx > 6 || dy > 6) return;
                    }
                    // Guard 1: hotspot label just clicked — don't clear
                    if (Date.now() - lastHotspotClickTimeRef.current < 200) return;
                    // Guard 2: camera is animating to hotspot front view
                    if (isHotspotFocusingRef.current) return;
                    if (selectedMaterial) {
                      setSelectedMaterial(null);
                    }
                  }}
                >
                  <planeGeometry args={[120, 120]} />
                  <shadowMaterial 
                    transparent 
                    opacity={Math.min(1, Math.max(0, (materialSettings.shadow ?? 50) / 100))} 
                    depthWrite={false} 
                    polygonOffset
                    polygonOffsetFactor={1}
                    polygonOffsetUnits={1}
                  />
                </mesh>
              )}

              {settings.base && !isCapturing && (
                 <mesh 
                    rotation={[-Math.PI / 2, 0, 0]} 
                    position={[0, -0.005, 0]} 
                    receiveShadow
                    onClick={(e) => {
                      // If a model mesh was clicked in front of the base plane, do not clear selection
                      if (e.intersections && e.intersections.length > 0 && e.intersections[0].object !== e.object) {
                        return;
                      }
                      if (canvasPointerDownPosRef.current) {
                        const dx = Math.abs(e.clientX - canvasPointerDownPosRef.current.x);
                        const dy = Math.abs(e.clientY - canvasPointerDownPosRef.current.y);
                        if (dx > 6 || dy > 6) return;
                      }
                      // Guard 1: hotspot label click leaks through to canvas — don't clear for 200ms
                      if (Date.now() - lastHotspotClickTimeRef.current < 200) return;
                      // Guard 2: camera is animating to hotspot front view
                      if (isHotspotFocusingRef.current) return;
                      if (selectedMaterial) {
                        setSelectedMaterial(null);
                      }
                    }}
                 >
                    <planeGeometry args={[120, 120]} />
                    <meshStandardMaterial color={settings.baseColor} roughness={0.8} side={THREE.DoubleSide} />
                 </mesh>
              )}



              <SmoothOrbitControls
                ref={controlsRef}
                sceneWrapperRef={sceneWrapperRef}
                autoRotate={autoRotate}
                dampingFactor={0.08}
                momentumFriction={0.95}
                rotateSpeed={1.0}
                minDistance={0.5}
                maxDistance={100}
                onChange={handleControlsChange}
              />

              {/* GIZMO HELPER - Also hide during capture */}
              {models.length > 0 && !isCapturing && (
                  <AnimatedGizmo 
                      isTextureOpen={isTextureOpen} 
                      activeTab="properties" 
                  />
              )}

              {/* 3D MESH HOTSPOTS & LABELS OVERLAY */}
              {models.length > 0 && !isCapturing && !showHotspotModal && (
                  <Hotspot3DOverlay
                    hotspots={hotspots}
                    activeHotspotId={activeHotspotId}
                    onHotspotClick={handleHotspotClick}
                    onDeleteHotspot={handleDeleteHotspot}
                    onEditHotspot={(hs) => {
                      setEditingHotspot(hs);
                      setShowHotspotModal(true);
                    }}
                    sceneWrapperRef={sceneWrapperRef}
                  />
              )}

              <Suspense fallback={null}>
                  <Environment
                      files={
                          (materialSettings?.environment?.startsWith('custom_') || (!materialSettings?.environment && (materialSettings?.customEnvMap || materialSettings?.maps?.envMap)))
                              ? (materialSettings?.customEnvMap || materialSettings?.maps?.envMap || null)
                              : null
                      }
                      preset={
                          (materialSettings?.environment?.startsWith('custom_') || (!materialSettings?.environment && (materialSettings?.customEnvMap || materialSettings?.maps?.envMap)))
                              ? null
                              : (materialSettings?.environment || 'studio')
                      }
                      background={!isCapturing}
                      blur={(materialSettings?.worldBlur ?? 0) / 100}
                      environmentIntensity={(materialSettings?.reflection ?? 50) <= 50 ? ((materialSettings?.reflection ?? 50) / 50) : 1.0 + (((materialSettings?.reflection ?? 50) - 50) / 50) * 2.0}
                  />
                  {/* SceneEnvironmentController enforces the rotation, opacity, blur, and reflection intensity every frame */}
                  <SceneEnvironmentController 
                      envRotation={materialSettings?.envRotation || 0} 
                      worldOpacity={materialSettings?.worldOpacity ?? 0}
                      worldBlur={materialSettings?.worldBlur ?? 0}
                      reflection={materialSettings?.reflection ?? 50}
                      isCapturing={isCapturing}
                  />
              </Suspense>
            </Canvas>
            )}
          </div>
        );
      })()}

          {/* Interactive Placement Mode Banner: Ready to add, user click on model anywhere then added point to add label */}
          {isPlacingHotspot && (
            <div className="absolute top-[1.2vw] left-1/2 -translate-x-1/2 z-40 pointer-events-auto animate-in fade-in slide-in-from-top-3 duration-200">
              <div className="flex items-center gap-[0.7vw] bg-neutral-900/90 backdrop-blur-md px-[1.2vw] py-[0.55vw] rounded-full shadow-2xl border border-indigo-500/50 text-white text-[0.8vw]">
                <span className="relative flex h-[0.7vw] w-[0.7vw]">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-[0.7vw] w-[0.7vw] bg-indigo-500"></span>
                </span>
                <span className="font-semibold text-white/95">Click anywhere on model to place hotspot pin</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsPlacingHotspot(false);
                    isPlacingHotspotRef.current = false;
                  }}
                  className="ml-[0.3vw] px-[0.6vw] py-[0.2vw] rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-[0.72vw] font-medium transition-colors cursor-pointer"
                >
                  Cancel (Esc)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT SETTINGS PANEL */}
        <div className="w-[22vw] h-full border-l border-gray-100 bg-white z-40 relative flex flex-col shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.05)]">
            <RightPanel
              onFileProcess={processFile}
              hasModel={models.length > 0}
              onExport={() => setShowExportModal(true)}
              autoRotate={autoRotate}
              setAutoRotate={setAutoRotate}
              xrayMode={xrayMode}
              setXrayMode={setXrayMode}
              isLoading={manualLoading}
              materialSettings={materialSettings}
              onUpdateMaterialSetting={handleMaterialUIUpdate}
              activeAccordion={activeAccordion}
              setActiveAccordion={setActiveAccordion}
              transformValues={transformValues}
              onManualTransformChange={handleManualTransformChange}
              onResetTransform={handleResetTransform}
              hotspots={hotspots}
              activeHotspotId={activeHotspotId}
              onHotspotClick={handleHotspotClick}
              onAddHotspot={() => handleOpenAddHotspot()}
              onEditHotspot={(hs) => {
                setEditingHotspot(hs);
                setShowHotspotModal(true);
              }}
              onDeleteHotspot={handleDeleteHotspot}
              selectedMaterial={selectedMaterial}
              rightPanelMode={rightPanelMode}
              onRightPanelModeChange={setRightPanelMode}
              onResetFactorSettings={() => {
                  setMaterialSettings(prev => {
                      const preservedEnvMap = prev.customEnvMap || prev.maps?.envMap || null;
                      const next = {
                          ...prev,
                           alpha: 100,
                           metallic: 0,
                           roughness: 0.5,
                           normal: 100,
                           bump: 50,
                           ao: 100,
                           scale: 100,
                           rotation: 0,
                           offset: { x: 0, y: 0 },
                           color: '#ffffff',
                           colorIntensity: 100,
                           emissiveColor: '#000000',
                           emissiveIntensity: 0,
                           maps: { map: null, normalMap: null, roughnessMap: null, metalnessMap: null, bumpMap: null, aoMap: null, alphaMap: null, ...(preservedEnvMap ? { envMap: preservedEnvMap } : {}) },
                           customEnvMap: preservedEnvMap,
                           appliedTexture: null
                       };
                      commitHistoryNow(buildSnapshot({
                          materialSettings: next,
                          selectedTexture: null,
                          selectedTextureId: null
                      }));
                      return next;
                  });
                  setResetKey(prev => prev + 1);
              }}
              onUvUnwrap={() => setUvUnwrapTrigger(prev => prev + 1)}
              onMapUpload={handleMapUpload}
              selectedTextureId={selectedTextureId}
              onSelectTexture={handleSelectTexture}
              savedHdrs={savedHdrs}
              onDeleteHdr={handleDeleteHdr}
              hasAnimations={hasAnimations}
              isAnimationPlaying={isAnimationPlaying}
              onToggleAnimation={setIsAnimationPlaying}
            />
        </div>
      </div>

          {showAddModelModal && (
              <AddModelModal
                  isOpen={showAddModelModal}
                  onClose={() => setShowAddModelModal(false)}
                  onAdd={handleAddModel}
              />
          )}

          {showModelGalleryModal && (
              <ModelGalleryModal
                  isOpen={showModelGalleryModal}
                  onClose={() => setShowModelGalleryModal(false)}
                  onSelectModel={handleSelectGalleryModel}
                  loadedModels={models}
                  onClearModel={handleClearModel}
              />
          )}

          {showAddMaterialModal && (
              <AddMaterial 
                  isOpen={showAddMaterialModal} 
                  onClose={() => setShowAddMaterialModal(false)}
                  onUpdateSuccess={() => setMaterialRefreshKey(prev => prev + 1)}
              />
          )}

          <AlertModal
              isOpen={formatErrorModal.isOpen}
              onClose={() => setFormatErrorModal({ isOpen: false, title: 'Invalid Model Format', message: '' })}
              type="error"
              title={formatErrorModal.title || "Invalid Model Format"}
              message={formatErrorModal.message}
              confirmText="Got it"
          />

          {showHotspotModal && (
            <HotspotModal
              isOpen={showHotspotModal}
              onClose={() => {
                setShowHotspotModal(false);
                setEditingHotspot(null);
              }}
              onSave={handleSaveHotspot}
              initialData={editingHotspot}
              selectedMesh={selectedMaterial}
              nextNumber={hotspots.length + 1}
            />
          )}
    </div>
  );
}




