import React, { useState, useEffect, useMemo } from "react";
import * as THREE from "three";
import { useLoader } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GLTFLoader as StdlibGLTFLoader } from 'three-stdlib';
import { LWOLoader } from 'three/examples/jsm/loaders/LWOLoader.js';
import { TDSLoader } from 'three/examples/jsm/loaders/TDSLoader.js';
import initOCCT from "occt-import-js";

import GenericModel from "./GenericModel";
import { LoadingSpinner } from "./GlobalLoader";
import { resolveUploadsPath } from "../../../utils/supabaseUtils";

// Safe GLTFLoader patch to prevent "Cannot set properties of undefined (setting 'isBone')" crashes on corrupted skin joints
function applySafeGLTFPatch(LoaderClass) {
  if (!LoaderClass || !LoaderClass.prototype || LoaderClass.prototype._isBonePatched) return;
  LoaderClass.prototype._isBonePatched = true;
  const originalParse = LoaderClass.prototype.parse;

  LoaderClass.prototype.parse = function (data, path, onLoad, onError) {
    this.register((parser) => {
      const proto = Object.getPrototypeOf(parser);
      if (proto && !proto._isBoneMarkDefsPatched) {
        proto._isBoneMarkDefsPatched = true;
        const originalMarkDefs = proto._markDefs;

        proto._markDefs = function () {
          // Pre-sanitize skins and nodeDefs so joints never point to undefined
          const nodeDefs = this.json.nodes || [];
          const skinDefs = this.json.skins || [];

          for (let skinIndex = 0, skinLength = skinDefs.length; skinIndex < skinLength; skinIndex++) {
            const skin = skinDefs[skinIndex];
            if (skin && skin.joints && Array.isArray(skin.joints)) {
              for (let j = 0; j < skin.joints.length; j++) {
                const nodeIdx = skin.joints[j];
                if (typeof nodeIdx === 'number' && nodeDefs[nodeIdx]) {
                  nodeDefs[nodeIdx].isBone = true;
                }
              }
            }
          }

          // Call the original Three.js _markDefs safely
          if (typeof originalMarkDefs === 'function') {
            try {
              originalMarkDefs.call(this);
            } catch (err) {
              console.warn("[SafeGLTF] Handled non-fatal notice in _markDefs:", err.message || err);
            }
          }
        };
      }

      return {
        name: "SafeSkinLoaderPlugin"
      };
    });

    return originalParse.call(this, data, path, onLoad, onError);
  };
}

applySafeGLTFPatch(GLTFLoader);
applySafeGLTFPatch(StdlibGLTFLoader);

// Safe TransformControls patch to prevent "Cannot read properties of undefined (reading 'updateMatrixWorld')" during cloning
import { TransformControls as StdlibTransformControls } from 'three-stdlib';
import { TransformControls as ThreeTransformControls } from 'three/examples/jsm/controls/TransformControls.js';

[StdlibTransformControls, ThreeTransformControls].forEach((TC) => {
  if (TC && TC.prototype && !TC.prototype._isSafeUpdateMatrixWorld) {
    TC.prototype._isSafeUpdateMatrixWorld = true;
    const orig = TC.prototype.updateMatrixWorld;
    TC.prototype.updateMatrixWorld = function (force) {
      if (!this.camera) return;
      return orig.call(this, force);
    };
  }
});

// Safe SkinnedMesh patch to prevent "Cannot read properties of undefined (reading 'matrixWorld')" in Box3 / applyBoneTransform
if (THREE.SkinnedMesh && THREE.SkinnedMesh.prototype && !THREE.SkinnedMesh.prototype._isMatrixWorldPatched) {
  THREE.SkinnedMesh.prototype._isMatrixWorldPatched = true;
  
  const origApplyBoneTransform = THREE.SkinnedMesh.prototype.applyBoneTransform;
  THREE.SkinnedMesh.prototype.applyBoneTransform = function (index, vector) {
    try {
      if (!this.skeleton || !this.skeleton.bones || this.skeleton.bones.length === 0) {
        return vector;
      }
      return origApplyBoneTransform.call(this, index, vector);
    } catch (err) {
      return vector;
    }
  };

  const origComputeBoundingBox = THREE.SkinnedMesh.prototype.computeBoundingBox;
  THREE.SkinnedMesh.prototype.computeBoundingBox = function () {
    try {
      if (this.skeleton && Array.isArray(this.skeleton.bones) && this.skeleton.bones.length > 0) {
        for (let i = 0; i < this.skeleton.bones.length; i++) {
          const b = this.skeleton.bones[i];
          if (b && !b.matrixWorld) b.updateMatrixWorld(true);
        }
        origComputeBoundingBox.call(this);
      } else {
        if (this.geometry) {
          this.geometry.computeBoundingBox();
          this.boundingBox = this.geometry.boundingBox ? this.geometry.boundingBox.clone() : new THREE.Box3();
        }
      }
    } catch (e) {
      if (this.geometry) {
        if (!this.geometry.boundingBox) this.geometry.computeBoundingBox();
        this.boundingBox = this.geometry.boundingBox ? this.geometry.boundingBox.clone() : new THREE.Box3();
      }
    }
  };
}

// Safe BufferGeometry.computeTangents patch to prevent "Missing required attributes (index, position, normal or uv)" errors on non-indexed geometries
if (THREE.BufferGeometry && THREE.BufferGeometry.prototype && !THREE.BufferGeometry.prototype._isSafeTangentsPatched) {
  THREE.BufferGeometry.prototype._isSafeTangentsPatched = true;
  const origComputeTangents = THREE.BufferGeometry.prototype.computeTangents;

  THREE.BufferGeometry.prototype.computeTangents = function () {
    const pos = this.attributes?.position;
    const uv = this.attributes?.uv;
    if (!pos || !uv) return;

    if (!this.attributes?.normal) {
      try { this.computeVertexNormals(); } catch (_) { return; }
    }
    if (!this.attributes?.normal) return;

    // If geometry is not indexed, synthesize sequential indices so Three.js can compute per-triangle tangents
    if (!this.index) {
      const count = pos.count;
      if (count && count >= 3 && count % 3 === 0) {
        try {
          const indices = count > 65535 ? new Uint32Array(count) : new Uint16Array(count);
          for (let i = 0; i < count; i++) indices[i] = i;
          this.setIndex(new THREE.BufferAttribute(indices, 1));
        } catch (_) {
          return;
        }
      } else {
        return;
      }
    }

    if (this.index && this.attributes.position && this.attributes.normal && this.attributes.uv) {
      try {
        return origComputeTangents.call(this);
      } catch (err) {
        // Silently skip if degenerate geometry prevents tangent calculation
        return;
      }
    }
  };
}

// URL Resolver Helper
const resolveUrl = (url) => {
    if (!url) return null;
    if (typeof url !== 'string') return url;
    return resolveUploadsPath(url);
};

// GLB Loader Component
export const GLBModel = React.forwardRef(({ url, shouldClone, ...props }, ref) => {
  const resolvedUrl = resolveUrl(url);
  const { scene, animations } = useGLTF(resolvedUrl);
  const displayScene = useMemo(() => {
    if (!scene) return null;
    const cloned = SkeletonUtils.clone(scene);
    if (cloned.userData?.normalization) {
      delete cloned.userData.normalization;
    }
    // Prefer useGLTF animations, fall back to scene.animations
    const srcAnimations = (animations && animations.length > 0) ? animations : (scene.animations || []);
    // Deep-clone each AnimationClip so this instance owns its tracks
    cloned.animations = srcAnimations.map(a => a.clone());
    cloned.traverse((child) => {
      if (!child.userData.__bindPos) {
        child.userData.__bindPos = [child.position.x, child.position.y, child.position.z];
        child.userData.__bindQuat = [child.quaternion.x, child.quaternion.y, child.quaternion.z, child.quaternion.w];
        child.userData.__bindScale = [child.scale.x, child.scale.y, child.scale.z];
      }
      if (child.isMesh || child.isSkinnedMesh) {
        if (child.geometry && !child.geometry.boundingSphere) {
          child.geometry.computeBoundingSphere();
        }
        child.frustumCulled = !child.isSkinnedMesh;
      }
    });
    console.log(`[GLBModel] Loaded ${cloned.animations.length} animation clip(s) from`, resolvedUrl);
    return cloned;
  }, [scene, animations, resolvedUrl]);

  return <GenericModel ref={ref} scene={displayScene} animations={displayScene?.animations} {...props} />;
});

// OBJ Loader Component
export const OBJModel = React.forwardRef(({ url, shouldClone, ...props }, ref) => {
  const resolvedUrl = resolveUrl(url);
  const scene = useLoader(OBJLoader, resolvedUrl);
  const displayScene = useMemo(() => shouldClone ? scene.clone() : scene, [scene, shouldClone]);
  return <GenericModel ref={ref} scene={displayScene} {...props} />;
});

// FBX Loader Component
export const FBXModel = React.forwardRef(({ url, shouldClone, onProgress, ...props }, ref) => {
  const [scene, setScene] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const resolvedUrl = resolveUrl(url);
    if (!resolvedUrl) {
      setLoading(false);
      return;
    }

    setLoading(true);
    onProgress?.(25, "Loading FBX model data...");

    // Isolated loading manager so external texture misses do not corrupt Drei's useProgress
    const isolatedManager = new THREE.LoadingManager();
    isolatedManager.onError = (itemUrl) => {
      console.warn(`[FBXModel] External resource notice (using fallback): ${itemUrl}`);
    };

    const loader = new FBXLoader(isolatedManager);
    if (typeof resolvedUrl === 'string' && !resolvedUrl.startsWith('blob:')) {
      const basePath = resolvedUrl.substring(0, resolvedUrl.lastIndexOf('/') + 1);
      loader.setResourcePath(basePath);
    }

    loader.load(
      resolvedUrl,
      (fbx) => {
        if (!isMounted) return;
        onProgress?.(80, "Configuring FBX meshes and materials...");
        const cloned = shouldClone ? SkeletonUtils.clone(fbx) : fbx;
        const clonedAnimations = (fbx.animations && fbx.animations.length > 0)
          ? fbx.animations.map(a => a.clone())
          : [];
        cloned.animations = clonedAnimations;
        cloned.traverse((child) => {
          if (!child.userData.__bindPos) {
            child.userData.__bindPos = [child.position.x, child.position.y, child.position.z];
            child.userData.__bindQuat = [child.quaternion.x, child.quaternion.y, child.quaternion.z, child.quaternion.w];
            child.userData.__bindScale = [child.scale.x, child.scale.y, child.scale.z];
          }
          if (child.isMesh || child.isSkinnedMesh) {
            child.frustumCulled = false;
            if (child.material) {
              const mats = Array.isArray(child.material) ? child.material : [child.material];
              mats.forEach(m => {
                m.needsUpdate = true;
                if (m.map && !m.map.image) m.map = null;
                if (m.normalMap && !m.normalMap.image) m.normalMap = null;
              });
            }
          }
        });
        setScene(cloned);
        setLoading(false);
        onProgress?.(100, "FBX model ready!");
      },
      (xhr) => {
        if (xhr.lengthComputable && xhr.total > 0) {
          const pct = Math.round((xhr.loaded / xhr.total) * 100);
          onProgress?.(Math.min(90, Math.max(20, pct)), `Loading FBX (${pct}%)...`);
        }
      },
      (err) => {
        console.error("FBX loading error:", err);
        if (isMounted) {
          setLoading(false);
          props.onError?.(err);
        }
      }
    );

    return () => {
      isMounted = false;
    };
  }, [url, shouldClone]);

  if (loading || !scene) return null;

  return <GenericModel ref={ref} scene={scene} animations={scene?.animations} {...props} />;
});

// STL Loader Component
export const STLModel = React.forwardRef(({ url, shouldClone, ...props }, ref) => {
  const resolvedUrl = resolveUrl(url);
  const geom = useLoader(STLLoader, resolvedUrl);
  
  const scene = useMemo(() => {
      const mat = new THREE.MeshStandardMaterial({ 
          color: 'gray',
          name: 'STL Material'
      });
      const mesh = new THREE.Mesh(geom, mat);
      const group = new THREE.Group();
      group.add(mesh);
      return group;
  }, [geom]);

  const displayScene = useMemo(() => shouldClone ? scene.clone() : scene, [scene, shouldClone]);

  return <GenericModel ref={ref} scene={displayScene} {...props} />;
});

// LWO / LOW Loader Component
export const LWOModel = React.forwardRef(({ url, shouldClone, ...props }, ref) => {
  const resolvedUrl = resolveUrl(url);
  const lwoData = useLoader(LWOLoader, resolvedUrl);
  
  const scene = useMemo(() => {
    const group = new THREE.Group();
    if (lwoData && lwoData.meshes && Array.isArray(lwoData.meshes)) {
      lwoData.meshes.forEach((mesh) => {
        group.add(mesh.clone());
      });
    }
    return group;
  }, [lwoData]);

  const displayScene = useMemo(() => shouldClone ? scene.clone() : scene, [scene, shouldClone]);

  return <GenericModel ref={ref} scene={displayScene} {...props} />;
});

// 3DS Loader Component
export const TDSModel = React.forwardRef(({ url, shouldClone, ...props }, ref) => {
  const resolvedUrl = resolveUrl(url);
  const scene = useLoader(TDSLoader, resolvedUrl);
  const displayScene = useMemo(() => shouldClone ? scene.clone() : scene, [scene, shouldClone]);
  return <GenericModel ref={ref} scene={displayScene} {...props} />;
});

// CAD (STEP / IGES) Loader Component
export const CadModel = React.forwardRef(({ url, format = 'step', onProgress, ...props }, ref) => {
    const [scene, setScene] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        async function loadCad() {
            const resolvedUrl = resolveUrl(url);
            if (!resolvedUrl) return;

            THREE.DefaultLoadingManager.itemStart(resolvedUrl);
            try {
                setLoading(true);
                onProgress?.(15, "Reading CAD file data...");
                
                // 1. Fetch file buffer
                const response = await fetch(resolvedUrl);
                const buffer = await response.arrayBuffer();
                
                if (!isMounted) {
                    THREE.DefaultLoadingManager.itemEnd(resolvedUrl);
                    return;
                }

                onProgress?.(35, "Initializing CAD engine...");

                // 2. Initialize OCCT
                const occt = await initOCCT({
                    locateFile: () => '/occt-import-js.wasm'
                });

                // 3. Read CAD file (IGES or STEP)
                const fileData = new Uint8Array(buffer);
                const isIges = format === 'iges' || format === 'igs' || props.type === 'iges' || props.type === 'igs' ||
                    (typeof resolvedUrl === 'string' && (resolvedUrl.toLowerCase().includes('.iges') || resolvedUrl.toLowerCase().includes('.igs')));

                onProgress?.(55, `Tessellating ${isIges ? 'IGES' : 'STEP'} CAD geometry...`);

                const fileSizeMB = buffer.byteLength / (1024 * 1024);
                const deflection = fileSizeMB > 10 ? 0.025 : (fileSizeMB > 3 ? 0.018 : 0.01);
                const params = {
                    linearUnit: 'millimeter',
                    linearDeflectionType: 'bounding_box_ratio',
                    linearDeflection: deflection,
                    angularDeflection: 0.65
                };

                // Allow UI to repaint
                await new Promise(r => setTimeout(r, 40));

                let result = null;
                try {
                    result = isIges
                        ? occt.ReadIgesFile(fileData, params)
                        : occt.ReadStepFile(fileData, params);
                } catch (readErr) {
                    console.warn(`[CadModel] Fast deflection read failed:`, readErr);
                }

                // Resilient fallback: If custom deflection returned no meshes, retry with default params
                if (!result || !result.meshes || result.meshes.length === 0) {
                    console.warn(`[CadModel] Fast deflection returned 0 meshes. Retrying with default params...`);
                    try {
                        result = isIges
                            ? occt.ReadIgesFile(fileData, null)
                            : occt.ReadStepFile(fileData, null);
                    } catch (fallbackErr) {
                        console.error(`[CadModel] Fallback read failed:`, fallbackErr);
                    }
                }

                if (!result || !result.meshes || result.meshes.length === 0) {
                     throw new Error(`No 3D meshes found in ${isIges ? 'IGES' : 'STEP'} CAD file.`);
                }

                onProgress?.(78, `Generating 3D meshes (${result.meshes.length} parts)...`);

                // Allow UI to breathe
                await new Promise(r => setTimeout(r, 20));

                // 4. Convert to Three.js
                const group = new THREE.Group();
                let matIndex = 1;
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
                            color: color,
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

                onProgress?.(88, "Positioning model on base grid...");

                if (isMounted) {
                    setScene(group);
                }

            } catch (err) {
                console.error("CAD Load Error:", err);
                props.onError?.(err);
            } finally {
                setLoading(false);
                try { THREE.DefaultLoadingManager.itemEnd(resolvedUrl); } catch (_) {}
            }
        }

        loadCad();
        return () => { isMounted = false; };
    }, [url, format]);

    if (loading || !scene) return null;

    return <GenericModel ref={ref} scene={scene} {...props} />;
});

// Backward-compatible alias components
export const StepModel = React.forwardRef((props, ref) => <CadModel ref={ref} format="step" {...props} />);
export const IgesModel = React.forwardRef((props, ref) => <CadModel ref={ref} format="iges" {...props} />);

// Helper component to choose the right model component
const RenderModel = React.forwardRef(({ type, url, ...props }, ref) => {
    if (!url) return null;
    
    let normalizedType = (type || '').toLowerCase().replace(/^\./, '');
    // Auto-detect format from URL if type is missing or generic
    if (!normalizedType || normalizedType === 'glb' || normalizedType === 'model') {
        const cleanUrl = (typeof url === 'string' ? url : '').split('?')[0].toLowerCase();
        const detectedExt = cleanUrl.split('.').pop();
        if (['obj', 'fbx', 'stl', 'step', 'stp', 'iges', 'igs', 'low', 'lwo', '3ds'].includes(detectedExt)) {
            normalizedType = detectedExt;
        }
    }
    
    switch(normalizedType) {
        case 'obj': return <OBJModel ref={ref} url={url} {...props} />;
        case 'fbx': return <FBXModel ref={ref} url={url} {...props} />;
        case 'stl': return <STLModel ref={ref} url={url} {...props} />;
        case 'step':
        case 'stp': return <StepModel ref={ref} url={url} {...props} />;
        case 'iges':
        case 'igs': return <IgesModel ref={ref} url={url} {...props} />;
        case 'low':
        case 'lwo': return <LWOModel ref={ref} url={url} {...props} />;
        case '3ds': return <TDSModel ref={ref} url={url} {...props} />;
        default: return <GLBModel ref={ref} url={url} {...props} />;
    }
});

export default RenderModel;
