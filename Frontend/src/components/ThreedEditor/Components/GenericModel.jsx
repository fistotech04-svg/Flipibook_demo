import React, { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { TransformControls } from "@react-three/drei";
import { GLTFExporter } from "three-stdlib";
import { OBJExporter } from "three-stdlib";
import { STLExporter } from "three-stdlib";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass.js";
import { resolveUploadsPath } from "../../../utils/supabaseUtils";

// Global cache and shared loader to prevent redundant network requests and decoding
// We use a private LoadingManager to avoid triggering the global useProgress spinner
const globalTextureCache = new Map();
const privateTextureManager = new THREE.LoadingManager();
const sharedTextureLoader = new THREE.TextureLoader(privateTextureManager);
sharedTextureLoader.setCrossOrigin('anonymous');

// Helper to extract a usable image URL/DataURL from a Three.js texture.
// NOTE: Three.js revokes blob: URLs after GPU texture upload — NEVER return blob: URLs directly!
const getTextureSource = (tex) => {
    if (!tex) return null;

    // Fast-path: already cached a valid data URL thumbnail
    if (tex.userData?.__thumbnailUrl) {
        const cached = tex.userData.__thumbnailUrl;
        if (cached && cached.startsWith('data:')) return cached;
    }

    // userData.url: only use for non-blob URLs (blob may already be revoked by Three.js)
    if (tex.userData?.url) {
        const u = tex.userData.url;
        if (u && typeof u === 'string' && !u.startsWith('blob:')) return u;
    }

    if (!tex.image) return 'existing';
    const img = tex.image;

    // ── Inner helper ────────────────────────────────────────────────────────────
    // Draws `source` into a 128×128 canvas and returns a JPEG data URL.
    // Returns null on any failure (SecurityError, zero dimensions, etc.).
    const tryThumbnail = (source, origW, origH) => {
        if (!origW || !origH) return null;
        try {
            const maxDim = 128;
            const scale = Math.min(1, maxDim / Math.max(origW, origH));
            const tw = Math.max(1, Math.round(origW * scale));
            const th = Math.max(1, Math.round(origH * scale));
            const canvas = document.createElement('canvas');
            canvas.width = tw;
            canvas.height = th;
            const ctx = canvas.getContext('2d');
            if (!ctx) return null;
            ctx.drawImage(source, 0, 0, tw, th);
            const thumb = canvas.toDataURL('image/jpeg', 0.7);
            // Verify it's a real data URL (not 'data:,' which is an empty canvas)
            if (!thumb || !thumb.startsWith('data:image')) return null;
            tex.userData = tex.userData || {};
            tex.userData.__thumbnailUrl = thumb;
            return thumb;
        } catch (_) {
            return null;
        }
    };

    // 1. DataTexture / raw Uint8 pixel data
    if (img.data && (img.data instanceof Uint8Array || img.data instanceof Uint8ClampedArray)) {
        const origW = img.width || 0;
        const origH = img.height || 0;
        if (origW && origH) {
            try {
                const maxDim = 128;
                const scale = Math.min(1, maxDim / Math.max(origW, origH));
                const tw = Math.max(1, Math.round(origW * scale));
                const th = Math.max(1, Math.round(origH * scale));
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = origW;
                tempCanvas.height = origH;
                const tempCtx = tempCanvas.getContext('2d');
                if (tempCtx) {
                    const imgData = tempCtx.createImageData(origW, origH);
                    imgData.data.set(img.data);
                    tempCtx.putImageData(imgData, 0, 0);
                    const canvas = document.createElement('canvas');
                    canvas.width = tw;
                    canvas.height = th;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.drawImage(tempCanvas, 0, 0, tw, th);
                        const thumb = canvas.toDataURL('image/jpeg', 0.7);
                        tex.userData = tex.userData || {};
                        tex.userData.__thumbnailUrl = thumb;
                        return thumb;
                    }
                }
            } catch (_) {}
        }
        return 'existing';
    }

    // 2. ImageBitmap — has width/height but NO .src
    if (typeof ImageBitmap !== 'undefined' && img instanceof ImageBitmap) {
        const origW = img.width || 0;
        const origH = img.height || 0;
        if (origW && origH) {
            const thumb = tryThumbnail(img, origW, origH);
            if (thumb) return thumb;
        }
        return 'existing';
    }

    // 3. HTMLCanvasElement (some loaders set the image to a canvas directly)
    if (typeof HTMLCanvasElement !== 'undefined' && img instanceof HTMLCanvasElement) {
        const origW = img.width || 0;
        const origH = img.height || 0;
        if (origW && origH) {
            const thumb = tryThumbnail(img, origW, origH);
            if (thumb) return thumb;
        }
        return 'existing';
    }

    // ── 4. HTMLImageElement / HTMLVideoElement — has .src or .currentSrc ─────────
    // IMPORTANT: blob: URLs from Three.js may already be revoked after GPU upload.
    // NEVER return a blob: URL directly — always generate a thumbnail instead.
    {
        const srcUrl = img.src || img.currentSrc || '';
        // Use naturalWidth/naturalHeight: these remain valid after blob revocation
        // because the image data is decoded in-memory in the element.
        const origW = img.naturalWidth || img.width || img.videoWidth || 0;
        const origH = img.naturalHeight || img.height || img.videoHeight || 0;

        if (origW && origH) {
            const thumb = tryThumbnail(img, origW, origH);
            if (thumb) return thumb;
        }

        // Only return the URL directly if it's a safe non-revokable URL:
        // - data: URIs are embedded data, never revoked
        // - http: URLs are permanent network URLs
        // - blob: URLs are REVOKED by Three.js → never return them
        if (srcUrl.startsWith('data:') && srcUrl.length < 500000) return srcUrl;
        if (srcUrl.startsWith('http') || srcUrl.startsWith('//')) return srcUrl;

        // blob: URLs or unknown — signal existence without returning a broken URL
        return 'existing';
    }

    // 5. Generic fallback: try to draw whatever img is into a canvas
    try {
        const origW = img.width || img.naturalWidth || img.videoWidth || 0;
        const origH = img.height || img.naturalHeight || img.videoHeight || 0;
        if (origW && origH) {
            const thumb = tryThumbnail(img, origW, origH);
            if (thumb) return thumb;
        }
    } catch (_) {}

    return 'existing';
};

// Safe helper to compute tangents without throwing or logging errors on non-indexed or attribute-deficient geometries
const safeComputeTangents = (geometry) => {
  if (!geometry || !geometry.isBufferGeometry || !geometry.attributes) return;
  if (geometry.attributes.tangent) return;

  const pos = geometry.attributes.position;
  const uv = geometry.attributes.uv;
  if (!pos || !uv || pos.count === 0 || uv.count === 0) return;

  if (!geometry.attributes.normal) {
    try { geometry.computeVertexNormals(); } catch (_) { return; }
  }
  if (!geometry.attributes.normal) return;

  // Synthesize sequential indices for non-indexed triangle meshes so computeTangents can calculate per-triangle tangents
  if (!geometry.index) {
    const count = pos.count;
    if (count && count >= 3 && count % 3 === 0) {
      try {
        const indices = count > 65535 ? new Uint32Array(count) : new Uint16Array(count);
        for (let i = 0; i < count; i++) indices[i] = i;
        geometry.setIndex(new THREE.BufferAttribute(indices, 1));
      } catch (_) {
        return;
      }
    } else {
      return;
    }
  }

  if (geometry.index && geometry.attributes.position && geometry.attributes.normal && geometry.attributes.uv) {
    try {
      geometry.computeTangents();
    } catch (_) {}
  }
};

// Safe Matrix3 and Matrix4 copy patches to prevent "Cannot read properties of undefined (reading 'elements')" in Three.js WebGLMaterials refreshTransformUniform
if (THREE.Matrix3 && THREE.Matrix3.prototype && !THREE.Matrix3.prototype._isSafeCopyPatched) {
  THREE.Matrix3.prototype._isSafeCopyPatched = true;
  const originalMatrix3Copy = THREE.Matrix3.prototype.copy;
  THREE.Matrix3.prototype.copy = function (m) {
    if (!m || !m.elements) {
      return this.identity();
    }
    return originalMatrix3Copy.call(this, m);
  };
}

if (THREE.Matrix4 && THREE.Matrix4.prototype && !THREE.Matrix4.prototype._isSafeCopyPatched) {
  THREE.Matrix4.prototype._isSafeCopyPatched = true;
  const originalMatrix4Copy = THREE.Matrix4.prototype.copy;
  THREE.Matrix4.prototype.copy = function (m) {
    if (!m || !m.elements) {
      return this.identity();
    }
    return originalMatrix4Copy.call(this, m);
  };
}

// Upgrades MeshStandardMaterial to MeshPhysicalMaterial so specularIntensity and dynamic specular highlights work
const ensurePhysicalMaterial = (mat) => {
  if (!mat) return mat;
  if (mat.isMeshStandardMaterial && !mat.isMeshPhysicalMaterial) {
    const phys = new THREE.MeshPhysicalMaterial();
    
    // Use MeshStandardMaterial.prototype.copy to safely copy standard properties
    // without triggering Three.js MeshPhysicalMaterial bug where it tries to copy undefined clearcoatNormalScale
    THREE.MeshStandardMaterial.prototype.copy.call(phys, mat);

    // Safely copy physical properties only if they exist on the source
    if (mat.clearcoat !== undefined) phys.clearcoat = mat.clearcoat;
    if (mat.clearcoatRoughness !== undefined) phys.clearcoatRoughness = mat.clearcoatRoughness;
    if (mat.clearcoatNormalMap) phys.clearcoatNormalMap = mat.clearcoatNormalMap;
    if (mat.clearcoatNormalScale && mat.clearcoatNormalScale.isVector2 && phys.clearcoatNormalScale) {
      phys.clearcoatNormalScale.copy(mat.clearcoatNormalScale);
    }
    if (mat.ior !== undefined) phys.ior = mat.ior;
    if (mat.reflectivity !== undefined) phys.reflectivity = mat.reflectivity;
    if (mat.transmission !== undefined) phys.transmission = mat.transmission;

    phys.uuid = mat.uuid; // Preserve UUID for selection and indexing
    phys.name = mat.name;
    phys.userData = { ...mat.userData };
    phys.specularIntensity = (mat.userData?.originalSpecularIntensity !== undefined) ? mat.userData.originalSpecularIntensity : 1.0;
    if (phys.specularColor) phys.specularColor.setRGB(1, 1, 1);
    phys.ior = 1.5;
    phys.needsUpdate = true;
    return phys;
  }
  return mat;
};

// --- Authentic Blender-style Silhouette Outline with 100% Native Lighting Preservation ---
// Native WebGL forward render ensures lighting, shadows, and HDRI reflections are 100% constant,
// while OutlinePass draws the authentic 2D silhouette outline directly on top of the canvas.
function MeshSelectionHighlight({ target }) {
  const { gl, scene, camera, size } = useThree();

  const targetSignature = useMemo(() => {
    if (!target) return '';
    const rawList = Array.isArray(target) ? target : [target];
    return rawList.map(m => m?.uuid || '').sort().join(',');
  }, [target]);

  // Collect all unique meshes belonging to the target
  const meshes = useMemo(() => {
    if (!target) return [];
    const rawList = Array.isArray(target) ? target : [target];
    const result = [];
    const seen = new Set();

    rawList.forEach((item) => {
      if (!item) return;
      if ((item.isMesh || item.isSkinnedMesh) && item.visible !== false) {
        if (!seen.has(item.uuid)) {
          seen.add(item.uuid);
          result.push(item);
        }
      } else if (item.traverse) {
        item.traverse((child) => {
          if ((child.isMesh || child.isSkinnedMesh) && child.geometry && child.visible !== false) {
            if (!seen.has(child.uuid)) {
              seen.add(child.uuid);
              result.push(child);
            }
          }
        });
      }
    });
    return result;
  }, [targetSignature]);

  // Dedicated lightweight proxy scene containing ONLY the selected mesh(es)
  const selectionData = useMemo(() => {
    if (meshes.length === 0) return null;
    const selScene = new THREE.Scene();
    const proxies = [];

    meshes.forEach((mesh) => {
      if (!mesh || !mesh.geometry) return;
      let proxy;
      if (mesh.isSkinnedMesh && mesh.skeleton) {
        proxy = new THREE.SkinnedMesh(mesh.geometry);
        proxy.skeleton = mesh.skeleton;
        proxy.bindMatrix = mesh.bindMatrix;
        proxy.bindMatrixInverse = mesh.bindMatrixInverse;
      } else {
        proxy = new THREE.Mesh(mesh.geometry);
      }
      proxy.matrixAutoUpdate = false;
      proxy.matrixWorldAutoUpdate = false;
      proxy.matrixWorld.copy(mesh.matrixWorld);
      proxy.frustumCulled = false;
      proxy.visible = true;

      selScene.add(proxy);
      proxies.push({ proxy, source: mesh });
    });

    return {
      selScene,
      proxies,
      proxyObjects: proxies.map((p) => p.proxy),
    };
  }, [meshes]);

  const outlinePassRef = useRef(null);

  useEffect(() => {
    if (!gl || !selectionData) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.floor(size.width * dpr);
    const height = Math.floor(size.height * dpr);

    const outlinePass = new OutlinePass(
      new THREE.Vector2(width, height),
      selectionData.selScene,
      camera
    );

    outlinePass.downSampleRatio = 1;
    const outlineColor = new THREE.Color("#ec5137");
    outlinePass.visibleEdgeColor.copy(outlineColor);
    outlinePass.hiddenEdgeColor.set(0, 0, 0); // No hidden edge ghosting through solid geometry
    outlinePass.edgeThickness = 1.8;
    outlinePass.edgeStrength = 5.0;
    outlinePass.edgeGlow = 0.0;
    outlinePass.selectedObjects = selectionData.proxyObjects;
    outlinePass.renderToScreen = false;

    // Use alpha blending to overlay outline directly onto native canvas
    if (outlinePass.overlayMaterial) {
      outlinePass.overlayMaterial.blending = THREE.CustomBlending;
      outlinePass.overlayMaterial.blendSrc = THREE.SrcAlphaFactor;
      outlinePass.overlayMaterial.blendDst = THREE.OneMinusSrcAlphaFactor;
      outlinePass.overlayMaterial.toneMapped = false;
      outlinePass.overlayMaterial.fragmentShader = `
        varying vec2 vUv;
        uniform sampler2D maskTexture;
        uniform sampler2D edgeTexture1;
        uniform sampler2D edgeTexture2;
        uniform float edgeStrength;
        uniform float edgeGlow;

        void main() {
          vec4 edgeValue1 = texture2D(edgeTexture1, vUv);
          vec4 edgeValue2 = texture2D(edgeTexture2, vUv);
          vec4 maskColor = texture2D(maskTexture, vUv);
          vec4 edgeValue = edgeValue1 + edgeValue2 * edgeGlow;
          vec4 finalColor = edgeStrength * maskColor.r * edgeValue;
          
          float maxChannel = max(finalColor.r, max(finalColor.g, finalColor.b));
          float alpha = clamp(maxChannel, 0.0, 1.0);
          vec3 rgb = maxChannel > 0.001 ? (finalColor.rgb / maxChannel) : vec3(0.925, 0.318, 0.216);
          
          gl_FragColor = vec4(rgb, alpha);
        }
      `;
      outlinePass.overlayMaterial.needsUpdate = true;
    }

    outlinePassRef.current = outlinePass;

    return () => {
      try {
        outlinePass.dispose();
      } catch (_) {}
      outlinePassRef.current = null;
    };
  }, [gl, camera, selectionData]);

  // Keep resolution updated on resize
  useEffect(() => {
    if (outlinePassRef.current) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.floor(size.width * dpr);
      const height = Math.floor(size.height * dpr);
      outlinePassRef.current.setSize(width, height);
      outlinePassRef.current.resolution.set(width, height);
    }
  }, [size.width, size.height]);

  // Render Loop: Native forward render + direct silhouette overlay
  useFrame((state, delta) => {
    // 1. Native Three.js scene render: 100% identical lighting, exposure, tone mapping & HDRI reflection!
    state.gl.render(state.scene, state.camera);

    // 2. Direct silhouette outline overlay on top of canvas (zero effect on scene lights)
    if (outlinePassRef.current && selectionData && selectionData.proxies.length > 0) {
      for (let i = 0; i < selectionData.proxies.length; i++) {
        const { proxy, source } = selectionData.proxies[i];
        if (source && proxy) {
          proxy.matrixWorld.copy(source.matrixWorld);
          proxy.visible = source.visible !== false;
        }
      }

      outlinePassRef.current.render(state.gl, null, null, delta, false);
    }
  }, 1);

  return null;
}

const SelectionBoundingBox = MeshSelectionHighlight;

const GenericModel = React.memo(React.forwardRef(({ scene, animations, wireframe, xrayMode, setModelStats, setMaterialList, selectedMaterial, onSelectMaterial, modelName, transformMode, materialSettings, hiddenMaterials, deletedMaterials, onTransformChange, onTransformStart, onTransformEnd, transformValues, meshTransforms, selectedTexture, onTextureApplied, onTextureIdentified, onUpdateMaterialSetting, resetKey, sceneResetTrigger, uvUnwrapTrigger, isSelectionDisabled, includeTextures, onModelReady, isAnimationPlaying = true, onHasAnimationsChange, activeHotspotMeshUuid, activeHotspotMeshName }, ref) => {
  const [position, setPosition] = useState(() => [0, 0, 0]);
  const [scale, setScale] = useState(() => 1);
  const groupRef = React.useRef(null);
  const meshPointerDownPosRef = useRef({ x: 0, y: 0 });
  const [modelGroup, setModelGroup] = useState(null);

  const [syncedSelectionSignature, setSyncedSelectionSignature] = useState(null);
  const activeTextureRef = React.useRef(selectedTexture);
  activeTextureRef.current = selectedTexture;

  const onUpdateMaterialSettingRef = React.useRef(onUpdateMaterialSetting);
  onUpdateMaterialSettingRef.current = onUpdateMaterialSetting;

  const onTextureIdentifiedRef = React.useRef(onTextureIdentified);
  onTextureIdentifiedRef.current = onTextureIdentified;

  // Animation Playback Support for GLB / FBX models
  const mixerRef = useRef(null);
  const onHasAnimationsChangeRef = useRef(onHasAnimationsChange);
  useEffect(() => {
    onHasAnimationsChangeRef.current = onHasAnimationsChange;
  });

  const lastHasAnimRef = useRef(null);
  const notifyHasAnimations = useCallback((val) => {
    const boolVal = Boolean(val);
    if (lastHasAnimRef.current !== boolVal) {
      lastHasAnimRef.current = boolVal;
      onHasAnimationsChangeRef.current?.(boolVal);
    }
  }, []);

  // Reset animations state on unmount
  useEffect(() => {
    return () => {
      if (lastHasAnimRef.current) {
        lastHasAnimRef.current = false;
        onHasAnimationsChangeRef.current?.(false);
      }
    };
  }, []);

  useEffect(() => {
      if (!scene) {
          notifyHasAnimations(false);
          return;
      }

      // Stop any existing mixer
      if (mixerRef.current) {
          try {
              mixerRef.current.stopAllAction();
              mixerRef.current.uncacheRoot(scene);
          } catch(_) {}
          mixerRef.current = null;
      }

      // Collect all AnimationClips from every possible source
      const allClips = [];
      const seen = new Set();
      const add = (c) => {
          if (!c || !Array.isArray(c.tracks) || c.tracks.length === 0) return;
          const id = c.uuid || c.name || Math.random().toString();
          if (seen.has(id)) return;
          seen.add(id);
          allClips.push(c);
      };

      // 1. Directly passed animations prop
      if (Array.isArray(animations)) animations.forEach(add);
      // 2. Animations stored on the scene root (set by GLBModel / FBXModel)
      if (Array.isArray(scene.animations)) scene.animations.forEach(add);
      // 3. Animations stored on any child node
      scene.traverse(child => {
          if (Array.isArray(child.animations)) child.animations.forEach(add);
      });

      const hasClips = allClips.length > 0;
      notifyHasAnimations(hasClips);

      if (!hasClips) return;

      // Capture untouched local bind transforms for all hierarchy nodes before animations begin modifying them
      scene.traverse((child) => {
          if (!child.userData.__bindPos) {
              child.userData.__bindPos = [child.position.x, child.position.y, child.position.z];
              child.userData.__bindQuat = [child.quaternion.x, child.quaternion.y, child.quaternion.z, child.quaternion.w];
              child.userData.__bindScale = [child.scale.x, child.scale.y, child.scale.z];
          }
      });

      // Ensure all animated and skinned meshes never get culled when moving
      scene.traverse((child) => {
          if (child.isMesh || child.isSkinnedMesh) {
              child.frustumCulled = false;
          }
      });

      console.log(`[GenericModel] Playing ${allClips.length} animation clip(s) on scene:`, allClips.map(c => c.name));

      const mixer = new THREE.AnimationMixer(scene);
      mixer.timeScale = isAnimationPlaying ? 1 : 0;

      // Smart clip conflict filter:
      // If clips target overlapping bone/property tracks (e.g. Idle vs Walk vs Run),
      // playing them all at once distorts the model. We play the primary action (first clip)
      // or all non-conflicting clips (e.g., separate parts of a multi-component model).
      const targetedProperties = new Set();
      const clipsToPlay = [];

      for (const clip of allClips) {
          let hasConflict = false;
          const currentClipProps = new Set();
          for (const track of clip.tracks) {
              const propKey = track.name;
              if (targetedProperties.has(propKey)) {
                  hasConflict = true;
                  break;
              }
              currentClipProps.add(propKey);
          }

          if (clipsToPlay.length === 0 || !hasConflict) {
              clipsToPlay.push(clip);
              currentClipProps.forEach(p => targetedProperties.add(p));
          }
      }

      clipsToPlay.forEach(clip => {
          try {
              const action = mixer.clipAction(clip);
              action.reset();
              action.setLoop(THREE.LoopRepeat, Infinity);
              action.clampWhenFinished = false;
              action.enabled = true;
              action.setEffectiveTimeScale(1);
              action.setEffectiveWeight(1);
              action.play();
          } catch(e) {
              console.warn("[GenericModel] Could not play animation clip:", clip.name, e);
          }
      });

      mixerRef.current = mixer;

      return () => {
          try {
              mixer.stopAllAction();
              mixer.uncacheRoot(scene);
          } catch(_) {}
          mixerRef.current = null;
      };
  }, [scene, animations, notifyHasAnimations]);

  // Sync mixer playback state dynamically when toggle changes
  useEffect(() => {
      if (mixerRef.current) {
          mixerRef.current.timeScale = isAnimationPlaying ? 1 : 0;
      }
  }, [isAnimationPlaying]);

  useFrame((state, delta) => {
      if (mixerRef.current && isAnimationPlaying !== false) {
          // Cap delta to prevent large frame jumps on lag / tab blur
          const safeDelta = Math.min(delta, 0.1);
          mixerRef.current.update(safeDelta);
      }
  });

  // Snapshot and preserve all original default textures and material properties on load
  useEffect(() => {
      if (!scene) return;
      const TEX_KEYS = ['map','normalMap','roughnessMap','metalnessMap','aoMap','emissiveMap','alphaMap','bumpMap','displacementMap'];
      scene.traverse((child) => {
          if (child.isMesh && child.material) {
              if (Array.isArray(child.material)) {
                  child.material = child.material.map(ensurePhysicalMaterial);
              } else {
                  child.material = ensurePhysicalMaterial(child.material);
              }
              const mats = Array.isArray(child.material) ? child.material : [child.material];
              mats.forEach((mat) => {
                  if (!mat.userData.origTexturesSnap) {
                      const snap = {};
                      TEX_KEYS.forEach(k => { if (mat[k]) snap[k] = mat[k]; });
                      mat.userData.origTexturesSnap = snap;
                      mat.userData.originalMap = mat.map;
                      mat.userData.originalNormalMap = mat.normalMap;
                      mat.userData.originalRoughnessMap = mat.roughnessMap;
                      mat.userData.originalMetalnessMap = mat.metalnessMap;
                      mat.userData.originalAoMap = mat.aoMap;
                      mat.userData.originalEmissiveMap = mat.emissiveMap;
                      mat.userData.originalAlphaMap = mat.alphaMap;
                      mat.userData.originalBumpMap = mat.bumpMap;
                      mat.userData.originalDisplacementMap = mat.displacementMap;
                      const isLikelyCutout = /fringe|tassel|cutout|thread|strand|leaf|foliage|hair|fur|trans|alpha/i.test(`${child.name || ''}_${mat.name || ''}`);
                      const hasAlphaMap = Boolean(mat.alphaMap);
                      const hasCutout = (mat.alphaTest !== undefined && mat.alphaTest > 0) || isLikelyCutout;
                      const isExplicitlyPartialOpacity = (mat.opacity !== undefined && mat.opacity < 0.999);
                      
                      // Sanitize transparency: GLTFLoader/FBXLoader often falsely mark materials as transparent=true
                      // based on alphaMode BLEND or 32-bit PNG alpha channels even when 100% opaque.
                      // Solid models must have transparent=false and depthWrite=true to prevent merging & transparent glitching!
                      const isTrulyTransparent = isExplicitlyPartialOpacity || hasAlphaMap;
                      mat.transparent = isTrulyTransparent;
                      mat.depthWrite = true;

                      if (hasCutout) {
                          mat.alphaTest = (mat.alphaTest !== undefined && mat.alphaTest > 0) ? mat.alphaTest : 0.5;
                          mat.transparent = false; // Discard alpha test with transparent=false eliminates alpha sorting artifacts
                          mat.depthWrite = true;
                      }

                      if (mat.color) {
                          if ((mat.map || mat.alphaMap || (mat.alphaTest > 0) || isLikelyCutout) && mat.color.r < 0.05 && mat.color.g < 0.05 && mat.color.b < 0.05) {
                              mat.color.setRGB(1, 1, 1);
                          }
                          mat.userData.originalColor = mat.color.clone();
                      }
                      mat.userData.originalRoughness = mat.roughness;
                      mat.userData.originalMetalness = mat.metalness;
                      mat.userData.originalOpacity = mat.opacity;
                      mat.userData.originalClearcoat = mat.clearcoat !== undefined ? mat.clearcoat : 0;
                      mat.userData.originalSpecularIntensity = mat.specularIntensity !== undefined ? mat.specularIntensity : 1.0;
                      mat.userData.originalEnvMapIntensity = mat.envMapIntensity !== undefined ? mat.envMapIntensity : 1.0;
                      mat.userData.originalAlphaTest = mat.alphaTest !== undefined ? mat.alphaTest : (isLikelyCutout ? 0.5 : 0);
                      mat.userData.originalTransparent = isTrulyTransparent;
                      mat.userData.originalDepthWrite = true;
                      mat.userData.originalSide = mat.side !== undefined ? mat.side : THREE.DoubleSide;
                  }

                  // Ensure alpha and depth properties are preserved on existing snapshots as well
                  if (mat.userData.originalAlphaTest === undefined) {
                      const isLikelyCutout = /fringe|tassel|cutout|thread|strand|leaf|foliage|hair|fur|trans|alpha/i.test(`${child.name || ''}_${mat.name || ''}`);
                      mat.userData.originalAlphaTest = (mat.alphaTest !== undefined && mat.alphaTest > 0) ? mat.alphaTest : (isLikelyCutout ? 0.5 : 0);
                      if (isLikelyCutout && (!mat.alphaTest || mat.alphaTest === 0)) mat.alphaTest = 0.5;
                  }
                  if (mat.userData.originalTransparent === undefined) {
                      mat.userData.originalTransparent = (mat.opacity !== undefined && mat.opacity < 0.999) || Boolean(mat.alphaMap);
                  }
                  if (mat.userData.originalDepthWrite === undefined) mat.userData.originalDepthWrite = true;
                  if (mat.userData.originalSide === undefined) mat.userData.originalSide = mat.side !== undefined ? mat.side : THREE.DoubleSide;

                  if (includeTextures === false) {
                      TEX_KEYS.forEach(k => { mat[k] = null; });
                  } else if (includeTextures === true && mat.userData.origTexturesSnap) {
                      TEX_KEYS.forEach(k => { mat[k] = mat.userData.origTexturesSnap[k]; });
                  }
                  mat.needsUpdate = true;
              });
          }
      });
  }, [scene, includeTextures]);

  // Multi-mesh transform support for shared materials
  const relatedMeshesRef = React.useRef([]);
  const followerOffsetsRef = React.useRef(new Map()); // Map<UUID, Matrix4 (relative to leader)>
  const isSyncingRef = React.useRef(false);

  // Pivot Object to center TransformControls on the selected mesh's visual bounding box
  const pivotRef = React.useRef(new THREE.Group());
  const pivotOffsetsRef = React.useRef(new Map()); // Map<UUID, Matrix4 (relative to pivot)>
  const isGizmoDraggingRef = React.useRef(false);

  const updatePivotToTarget = useCallback((target, related = []) => {
    if (!target) return;
    const pivot = pivotRef.current;
    if (!pivot) return;

    const list = (related && related.length > 0) ? related : [target];
    const box = new THREE.Box3();
    let hasValidMesh = false;
    list.forEach(m => {
      if (m && (m.isMesh || m.isSkinnedMesh) && m.visible !== false) {
        m.updateMatrixWorld(true);
        box.expandByObject(m);
        hasValidMesh = true;
      }
    });

    const worldCenter = new THREE.Vector3();
    if (hasValidMesh && !box.isEmpty() && isFinite(box.min.x)) {
      box.getCenter(worldCenter);
    } else if (typeof target.getWorldPosition === 'function') {
      target.getWorldPosition(worldCenter);
    } else if (target.position) {
      worldCenter.copy(target.position);
    }

    pivot.position.copy(worldCenter);
    if (list.length === 1 && target && target.quaternion) {
      pivot.quaternion.copy(target.quaternion);
    } else {
      pivot.rotation.set(0, 0, 0);
    }
    pivot.scale.set(1, 1, 1);
    pivot.updateMatrix();
    pivot.updateMatrixWorld(true);

    const pivotWorldInverse = new THREE.Matrix4().copy(pivot.matrixWorld).invert();
    const offsets = new Map();
    list.forEach(mesh => {
      if (mesh && mesh.uuid) {
        mesh.updateMatrixWorld(true);
        const rel = new THREE.Matrix4().multiplyMatrices(pivotWorldInverse, mesh.matrixWorld);
        offsets.set(mesh.uuid, rel);
      }
    });
    pivotOffsetsRef.current = offsets;
  }, []);

  // Mesh Index for fast material lookups - avoids expensive scene.traverse calls
  const meshIndexRef = React.useRef(new Map()); // Map<MaterialName, Mesh[]>

  // Helper to ensure a mesh has its own unique, cloned material instance if its material is shared with other meshes.
  // This guarantees that changing color, textures, or material properties on a selected mesh will NEVER bleed into other meshes!
  const ensureMeshUniqueMaterial = useCallback((mesh, allowedSharedSet = null) => {
      if (!mesh || !scene) return;
      const currentMat = mesh.userData?.__preXrayMaterial || mesh.material;
      if (!currentMat) return;
      const mats = Array.isArray(currentMat) ? currentMat : [currentMat];
      let didClone = false;
      const newMats = mats.map(m => {
          if (!m) return m;
          let isShared = false;
          scene.traverse(c => {
              if (isShared) return;
              if (c.isMesh && c !== mesh && (c.material || c.userData?.__preXrayMaterial)) {
                  // If allowedSharedSet is provided (e.g. all selected meshes), meshes within the set can share,
                  // but if shared with an unselected mesh outside, it must clone!
                  if (allowedSharedSet && allowedSharedSet.has(c)) return;
                  const cMat = c.userData?.__preXrayMaterial || c.material;
                  const cm = Array.isArray(cMat) ? cMat : [cMat];
                  if (cm.some(mat => mat === m || (mat.uuid && mat.uuid === m.uuid))) {
                      isShared = true;
                  }
              }
          });
          if (isShared) {
              const cloned = m.clone();
              cloned.name = `${m.name || 'Material'}_${mesh.name || mesh.uuid.slice(0, 4)}`;
              cloned.userData = { ...m.userData };
              if (m.userData.originalColor && typeof m.userData.originalColor.clone === 'function') {
                  cloned.userData.originalColor = m.userData.originalColor.clone();
              }
              didClone = true;
              if (meshIndexRef.current) {
                  meshIndexRef.current.set(cloned.name, [mesh]);
              }
              return cloned;
          }
          return m;
      });
      if (didClone) {
          const finalMat = Array.isArray(currentMat) ? newMats : newMats[0];
          if (mesh.userData?.__preXrayMaterial) {
              mesh.userData.__preXrayMaterial = finalMat;
          } else {
              mesh.material = finalMat;
              mesh.material.needsUpdate = true;
          }
      }
  }, [scene]);

  // Helper to resolve all 3D meshes targeted by the current selection
  const resolveTargetMeshes = useCallback((selMat) => {
      if (!selMat || !scene) return [];

      const isMeshDeleted = (child) => {
          if (!deletedMaterials || deletedMaterials.size === 0) return false;
          if (child.uuid && deletedMaterials.has(child.uuid)) return true;
          const m = child.userData?.__preXrayMaterial || child.material;
          const mats = Array.isArray(m) ? m : [m];
          return mats.some(mat => mat?.name && deletedMaterials.has(mat.name));
      };

      const isFullModel = !selMat || selMat.isAll || (modelName && (selMat.name === modelName || selMat === modelName)) || selMat.name === "Scene" || selMat === "Scene" || selMat.name === "All Meshes";
      if (isFullModel) {
          const all = [];
          scene.traverse(child => {
              if (child.isMesh && (child.material || child.userData?.__preXrayMaterial) && child.visible !== false && !isMeshDeleted(child)) {
                  all.push(child);
              }
          });
          return all;
      }

      // 1. Group / Multi-Selection
      if (selMat.isGroup || selMat.isMultiSelect || Array.isArray(selMat.items) || Array.isArray(selMat.uuids)) {
          const rawUuids = Array.isArray(selMat.uuids) ? selMat.uuids : 
                           (Array.isArray(selMat.items) ? selMat.items.map(it => it?.uuid || it?.meshUuid).filter(Boolean) : []);
          
          if (rawUuids.length > 0) {
              const uuidSet = new Set(rawUuids);
              const result = new Set();
              rawUuids.forEach(u => {
                  if (meshIndexRef.current.has(u)) {
                      meshIndexRef.current.get(u).forEach(c => {
                          if (!isMeshDeleted(c)) result.add(c);
                      });
                  }
              });
              if (result.size < uuidSet.size) {
                  scene.traverse(child => {
                      if (child.isMesh && uuidSet.has(child.uuid) && !isMeshDeleted(child)) {
                          result.add(child);
                      }
                  });
              }
              if (result.size > 0) return Array.from(result);
          }

          // Fallback for group defined by material names (e.g. material folder)
          if (Array.isArray(selMat.materials) && selMat.materials.length > 0) {
              const result = new Set();
              selMat.materials.forEach(mName => {
                  if (meshIndexRef.current.has(mName)) {
                      meshIndexRef.current.get(mName).forEach(c => {
                          if (!isMeshDeleted(c)) result.add(c);
                      });
                  }
              });
              if (result.size > 0) return Array.from(result);

              const matSet = new Set(selMat.materials);
              scene.traverse(child => {
                  if (child.isMesh && (child.material || child.userData?.__preXrayMaterial) && child.visible !== false && !isMeshDeleted(child)) {
                      const m = child.userData?.__preXrayMaterial || child.material;
                      const mats = Array.isArray(m) ? m : [m];
                      if (
                          matSet.has(child.uuid) ||
                          matSet.has(child.name) ||
                          mats.some(mat => mat && matSet.has(mat.name))
                      ) {
                          result.add(child);
                      }
                  }
              });
              if (result.size > 0) return Array.from(result);
          }
      }

      const targetUuid = selMat.uuid || selMat.meshUuid;
      const targetMat = typeof selMat.material === 'string' ? selMat.material : selMat.material?.name;
      const targetName = selMat.meshName || selMat.name;

      // 1. Single mesh selection: Strictly resolve by targetUuid if available
      if (targetUuid && !selMat.isGroup && !selMat.isAll) {
          if (meshIndexRef.current.has(targetUuid)) {
              const list = meshIndexRef.current.get(targetUuid).filter(c => !isMeshDeleted(c));
              if (list.length > 0) return list;
          }
          const exactMatch = [];
          scene.traverse(child => {
              if (child.isMesh && child.uuid === targetUuid && !isMeshDeleted(child)) {
                  exactMatch.push(child);
              }
          });
          if (exactMatch.length > 0) return exactMatch;
      }

      // 2. Fallback when targetUuid is not available (e.g. legacy selection)
      if (selMat.isMesh) {
          // It's a single mesh: return AT MOST ONE matching mesh by name, never a list of sibling meshes!
          if (targetName && meshIndexRef.current.has(targetName)) {
              const list = meshIndexRef.current.get(targetName).filter(c => !isMeshDeleted(c));
              if (list.length > 0) return [list[0]];
          }
          let singleFound = null;
          scene.traverse(child => {
              if (singleFound) return;
              if (child.isMesh && child.name === targetName && !isMeshDeleted(child)) {
                  singleFound = child;
              }
          });
          if (singleFound) return [singleFound];
      }

      // 3. Material-level selection (e.g. selecting an entire shared material)
      if (targetMat && meshIndexRef.current.has(targetMat)) {
          return meshIndexRef.current.get(targetMat).filter(c => !isMeshDeleted(c));
      }

      const matches = [];
      scene.traverse(child => {
          if (child.isMesh && (child.material || child.userData?.__preXrayMaterial) && !isMeshDeleted(child)) {
              const activeMat = child.userData?.__preXrayMaterial || child.material;
              if (targetMat) {
                  const mats = Array.isArray(activeMat) ? activeMat : [activeMat];
                  if (mats.some(m => m && m.name === targetMat)) {
                      matches.push(child);
                  }
              }
          }
      });
      return matches;
  }, [scene, modelName, deletedMaterials]);

  // Helper to resolve the primary THREE.Material targeted by the current selection
  const resolveTargetMaterial = useCallback((selMat) => {
      if (!selMat || !scene) return null;

      const isFullModel = !selMat || (modelName && (selMat.name === modelName || selMat === modelName)) || selMat.name === "Scene" || selMat === "Scene";
      if (isFullModel) {
          return null;
      }

      const targetUuid = selMat.uuid || selMat.meshUuid || 
                         (Array.isArray(selMat.uuids) && selMat.uuids[0]) || 
                         (Array.isArray(selMat.items) && (selMat.items[0]?.uuid || selMat.items[0]?.meshUuid));
      const targetMat = typeof selMat.material === 'string' ? selMat.material : (selMat.material?.name || (Array.isArray(selMat.materials) ? selMat.materials[0] : null));
      const targetName = selMat.meshName || selMat.name || (Array.isArray(selMat.meshNames) ? selMat.meshNames[0] : null);

      if (targetUuid) {
          let found = null;
          scene.traverse(child => {
              if (found) return;
              if (child.isMesh && child.uuid === targetUuid && (child.material || child.userData?.__preXrayMaterial)) {
                  const activeMat = child.userData?.__preXrayMaterial || child.material;
                  if (Array.isArray(activeMat)) {
                      found = targetMat ? (activeMat.find(m => m.name === targetMat) || activeMat[0]) : activeMat[0];
                  } else {
                      found = activeMat;
                  }
              }
          });
          if (found) return found;
      }

      if (targetMat && meshIndexRef.current.has(targetMat)) {
          const meshes = meshIndexRef.current.get(targetMat);
          if (meshes.length > 0 && (meshes[0].material || meshes[0].userData?.__preXrayMaterial)) {
              const m = meshes[0].userData?.__preXrayMaterial || meshes[0].material;
              return Array.isArray(m) ? (m.find(mat => mat.name === targetMat) || m[0]) : m;
          }
      }

      if (targetName && meshIndexRef.current.has(targetName)) {
          const meshes = meshIndexRef.current.get(targetName);
          if (meshes.length > 0 && (meshes[0].material || meshes[0].userData?.__preXrayMaterial)) {
              const m = meshes[0].userData?.__preXrayMaterial || meshes[0].material;
              return Array.isArray(m) ? m[0] : m;
          }
      }

      let found = null;
      scene.traverse(child => {
          if (found) return;
          if (child.isMesh && (child.material || child.userData?.__preXrayMaterial)) {
              const activeMat = child.userData?.__preXrayMaterial || child.material;
              const mats = Array.isArray(activeMat) ? activeMat : [activeMat];
              for (const m of mats) {
                  if (m && ((targetMat && m.name === targetMat) || (targetName && m.name === targetName))) {
                      found = m;
                      break;
                  }
              }
          }
      });
      return found;
  }, [scene, modelName]);

  // Memoized user-specified X-Ray Material (Optimized for instant 60 FPS performance)
  // envMapIntensity: 0 and roughness: 1.0 prevent HDRI reflections from glaring on X-ray surfaces
  const xrayMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: 0x00aaff,       // X-ray color
    transparent: true,
    opacity: 0.25,
    roughness: 1.0,
    metalness: 0.0,
    envMapIntensity: 0.0,
    depthWrite: false,
    side: THREE.DoubleSide
  }), []);

  // X-Ray View: When xrayMode is active, ONLY the currently selected mesh(es) are displayed with xrayMaterial.
  // When selection changes or xrayMode is toggled off, meshes are cleanly restored to their original materials.
  useEffect(() => {
    if (!scene) return;

    if (xrayMode) {
      const isSceneBackground = selectedMaterial?.name === 'Scene';

      // Resolve meshes targeted by the current selection (single mesh, multiple meshes, folder, or full model)
      const targetMeshes = !isSceneBackground && selectedMaterial ? resolveTargetMeshes(selectedMaterial) : [];
      const targetSet = new Set(targetMeshes);

      scene.traverse((child) => {
        if (child.isMesh || child.isSkinnedMesh) {
          if (targetSet.has(child)) {
            // Selected mesh: switch to xrayMaterial, preserving original material and shadow state
            if (child.material !== xrayMaterial) {
              if (!child.userData.__preXrayMaterial) {
                child.userData.__preXrayMaterial = child.material;
                child.userData.__preXrayCastShadow = child.castShadow;
              }
              child.material = xrayMaterial;
              child.castShadow = false;
            }
          } else {
            // Unselected mesh: if it was previously in xray, restore its original material and shadow
            if (child.userData?.__preXrayMaterial) {
              child.material = child.userData.__preXrayMaterial;
              if (child.userData.__preXrayCastShadow !== undefined) {
                child.castShadow = child.userData.__preXrayCastShadow;
                delete child.userData.__preXrayCastShadow;
              }
              delete child.userData.__preXrayMaterial;
            }
          }
        }
      });
    } else {
      // X-Ray turned off: restore ALL meshes that have saved pre-xray material
      scene.traverse((child) => {
        if ((child.isMesh || child.isSkinnedMesh) && child.userData?.__preXrayMaterial) {
          child.material = child.userData.__preXrayMaterial;
          if (child.userData.__preXrayCastShadow !== undefined) {
            child.castShadow = child.userData.__preXrayCastShadow;
            delete child.userData.__preXrayCastShadow;
          }
          delete child.userData.__preXrayMaterial;
        }
      });
    }
  }, [scene, xrayMode, selectedMaterial, modelName, resolveTargetMeshes, xrayMaterial]);

  // Clean restoration on unmount
  useEffect(() => {
    return () => {
      if (scene) {
        scene.traverse((child) => {
          if ((child.isMesh || child.isSkinnedMesh) && child.userData?.__preXrayMaterial) {
            child.material = child.userData.__preXrayMaterial;
            if (child.userData.__preXrayCastShadow !== undefined) {
              child.castShadow = child.userData.__preXrayCastShadow;
              delete child.userData.__preXrayCastShadow;
            }
            delete child.userData.__preXrayMaterial;
          }
        });
      }
    };
  }, [scene]);




  // Expose Three.js Scene Root augmented with helper methods
  React.useImperativeHandle(ref, () => {
      if (!scene) return null;
      scene.deleteMaterial = (matName) => {
          const meshesToRemove = [];
          scene.traverse((child) => {
              if (child.isMesh && child.material) {
                  let shouldDelete = false;
                  if (Array.isArray(child.material)) {
                      shouldDelete = child.material.some(m => m.name === matName);
                  } else {
                      shouldDelete = child.material.name === matName;
                  }
                  if (shouldDelete) meshesToRemove.push(child);
              }
          });
          meshesToRemove.forEach(mesh => {
              if (mesh.parent) {
                  mesh.parent.remove(mesh);
                  if (mesh.geometry) mesh.geometry.dispose();
              }
          });
      };
      scene.renameMaterial = (oldName, newName) => {
          if (!oldName || !newName) return;
          scene.traverse((child) => {
              if (child.name === oldName) {
                  child.name = newName;
              }
              if (child.isMesh && child.material) {
                  const mats = Array.isArray(child.material) ? child.material : [child.material];
                  mats.forEach(m => {
                      if (m.name === oldName) {
                          m.name = newName;
                      }
                  });
              }
          });
      };
      scene.scene = scene;
      return scene;
  }, [scene]);
    
  // 0. Apply Texture to Selected Material
  useEffect(() => {
     if (!selectedTexture || !scene || xrayMode) return;
     
     // Use a separate LoadingManager to avoid triggering the global useProgress spinner
     const textureManager = new THREE.LoadingManager();
     const loader = new THREE.TextureLoader(textureManager);
     
     const resolveUrl = (url) => {
        if (!url) return null;
        if (typeof url !== 'string') return url;
        return resolveUploadsPath(url);
     };

     const loadMap = (url, isColor = false) => {
          const resolved = resolveUrl(url);
          if (!resolved || resolved === "existing") return null;

          const cacheKey = `${resolved}_${isColor}`;
          if (globalTextureCache.has(cacheKey)) {
              return globalTextureCache.get(cacheKey);
          }

          const tex = sharedTextureLoader.load(resolved, (t) => {
              t.wrapS = t.wrapT = THREE.RepeatWrapping;
              t.flipY = false; 
              t.colorSpace = isColor ? THREE.SRGBColorSpace : THREE.NoColorSpace;
              t.anisotropy = 8; // Performance optimization: 8 is usually plenty and faster than 16
              t.userData = { url: resolved };
              t.needsUpdate = true;
          });
          tex.userData = { url: resolved };

          globalTextureCache.set(cacheKey, tex);
          return tex;
     }

     const newMaps = {};
     const m = selectedTexture?.maps || {};
     // Support both old keys (map, normalMap) and new keys (base, normal)
     const baseImg = m.map || m.base;
     const normalImg = m.normalMap || m.normal;
     const roughnessImg = m.roughnessMap || m.roughness;
     const metallicImg = m.metalnessMap || m.metallic || m.metalness;
     const aoImg = m.aoMap || m.ao;
     const displacementImg = m.displacementMap || m.displacement;
     const alphaImg = m.alphaMap || m.opacity;

     if (baseImg) newMaps.map = loadMap(baseImg, true);
     if (normalImg) newMaps.normalMap = loadMap(normalImg, false);
     if (roughnessImg) newMaps.roughnessMap = loadMap(roughnessImg, false);
     if (metallicImg) newMaps.metalnessMap = loadMap(metallicImg, false);
     if (aoImg) newMaps.aoMap = loadMap(aoImg, false);
     if (displacementImg) newMaps.displacementMap = loadMap(displacementImg, false);
     if (alphaImg) newMaps.alphaMap = loadMap(alphaImg, false);

     const selMat = selectedMaterial; 
     const targetMatName = selMat ? selMat.name : null;

     const isFullModelSelect = !targetMatName || (modelName && targetMatName === modelName) || targetMatName === "Scene";
     const targetedMeshes = isFullModelSelect ? [] : resolveTargetMeshes(selMat);
     const targetMeshSet = new Set(targetedMeshes);

     // Optimized application using mesh index
     const processedMaterials = new Set();

     const applyToMesh = (child) => {
          if (child.isMesh && (child.material || child.userData?.__preXrayMaterial)) {
              if (!isFullModelSelect) {
                  ensureMeshUniqueMaterial(child, targetMeshSet);
              }
              const apply = (mat) => {
                   if (!mat.isMeshStandardMaterial && !mat.isMeshPhysicalMaterial && !mat.isMeshPhongMaterial) return;
                   if (processedMaterials.has(mat.uuid)) return;
                   processedMaterials.add(mat.uuid);
                   
                    // Surgical replacement: Only replace maps that are provided by the new texture.
                    // This prevents clobbering existing maps (like an original diffuse map) when applying a partial gallery texture.
                    if (newMaps.map) {
                        mat.map = newMaps.map;
                        mat.userData.appliedMap = newMaps.map;
                    }
                    if (newMaps.normalMap) {
                        mat.normalMap = newMaps.normalMap;
                        mat.bumpMap = newMaps.normalMap; // Use normal map as bump fallback
                        if (!mat.bumpScale) mat.bumpScale = 1;
                    }
                    if (newMaps.aoMap) mat.aoMap = newMaps.aoMap;
                    if (newMaps.displacementMap) {
                        mat.displacementMap = newMaps.displacementMap;
                        if (mat.displacementScale === undefined) mat.displacementScale = 0.01;
                    }
                    if (newMaps.alphaMap) {
                        mat.alphaMap = newMaps.alphaMap;
                        mat.transparent = true;
                    }
                    
                    // Clear any ongoing flash and reset emissive
                    mat.userData.isFlashing = false;
                    if (mat.emissive && typeof mat.emissive.set === 'function') {
                        mat.emissive.set(0, 0, 0);
                        mat.emissiveIntensity = 0;
                    }

                    if (mat.isMeshStandardMaterial || mat.isMeshPhysicalMaterial || mat.isMeshPhongMaterial) {
                        if (newMaps.roughnessMap) {
                            mat.roughnessMap = newMaps.roughnessMap;
                            mat.roughness = 1.0; // Reset factor for full map influence
                        }
                        if (newMaps.metalnessMap) {
                            mat.metalnessMap = newMaps.metalnessMap;
                            if (mat.metalness !== undefined) mat.metalness = 1.0;
                        }
                        
                        // Reset color to white if a base map is being applied so it's not tinted
                        if (newMaps.map && mat.color && typeof mat.color.set === 'function') {
                            mat.color.set(0xffffff);
                        }
                    }
                    
                    // Save the full texture object for later identification
                    if (selectedTexture.id) {
                        mat.userData.appliedTexture = selectedTexture;
                        mat.userData.appliedTextureId = selectedTexture.id;
                    } else {
                        delete mat.userData.appliedTexture;
                        delete mat.userData.appliedTextureId;
                    }
                    
                    mat.needsUpdate = true;
              };

              if (Array.isArray(child.material)) {
                  child.material.forEach(apply);
              } else {
                  apply(child.material);
              }
          }
     };

     if (isFullModelSelect) {
         meshIndexRef.current.forEach(meshes => {
             meshes.forEach(applyToMesh);
         });
     } else {
         const targetMeshes = resolveTargetMeshes(selMat);
         targetMeshes.forEach(applyToMesh);
     }
     
     // Update the UI immediately to reflect the new texture as "Active" for this material
     onTextureIdentifiedRef.current?.(selectedTexture.id || null);

     // Notify parent that texture has been processed so we can reset state
     if (typeof onTextureApplied === 'function') {
         onTextureApplied();
     }
  }, [selectedTexture, scene, selectedMaterial, modelName, onTextureApplied]);

  // 0.2. Apply Manual Map Uploads
  useEffect(() => {
    if (!materialSettings?.maps || !scene || xrayMode) return;
    
    // We only apply to the selected material (scoping is handled by the component that updates maps)
    const selMat = selectedMaterial;
    const targetMatName = selMat ? selMat.name : null;
    
    // CRITICAL: Manual map uploads are strictly for when the user explicitly uploads a map file
    // for a specific selected material (changedProp === 'maps' || changedProp === 'appliedTexture').
    // NEVER run this on full model or on reset/undo to avoid stripping native GLTF textures!
    const isFullModel = !selMat || targetMatName === modelName || targetMatName === "Scene";
    if (isFullModel || !targetMatName) return;

    const changedProp = materialSettings.lastChangedProp;
    if (changedProp !== 'maps' && changedProp !== 'appliedTexture') return;

    const textureManager = new THREE.LoadingManager();
    const loader = new THREE.TextureLoader(textureManager);
    
    const resolveUrlLocal = (url) => {
        if (!url) return null;
        if (typeof url !== 'string') return url;
        return resolveUploadsPath(url);
    };

    const loadMapManual = (url, isColor = false) => {
          const resolved = resolveUrlLocal(url);
          if (!resolved || resolved === "existing") return null;
          
          const cacheKey = `${resolved}_${isColor}`;
          if (globalTextureCache.has(cacheKey)) {
              return globalTextureCache.get(cacheKey);
          }

          const tex = sharedTextureLoader.load(resolved, (t) => {
              t.wrapS = t.wrapT = THREE.RepeatWrapping;
              t.flipY = false; 
              t.colorSpace = isColor ? THREE.SRGBColorSpace : THREE.NoColorSpace;
              t.anisotropy = 8;
              t.userData = { url: resolved };
              t.needsUpdate = true;
          });
          tex.userData = { url: resolved };
          
          globalTextureCache.set(cacheKey, tex);
          return tex;
    }

    const newMapsList = materialSettings.maps;
    const loadedMaps = {};
    
    // Support both old keys and new keys
    const baseImg = newMapsList.map || newMapsList.base;
    const normalImg = newMapsList.normalMap || newMapsList.normal;
    const roughnessImg = newMapsList.roughnessMap || newMapsList.roughness;
    const metalnessImg = newMapsList.metalnessMap || newMapsList.metallic || newMapsList.metalness;
    const displacementImg = newMapsList.displacementMap || newMapsList.displacement;
    const bumpImg = newMapsList.bumpMap || newMapsList.bump;
    const aoImg = newMapsList.aoMap || newMapsList.ao;
    const alphaImg = newMapsList.alphaMap || newMapsList.opacity;
    const emissiveImg = newMapsList.emissiveMap || newMapsList.emissive;

    const texScaleX = 100 / (materialSettings.scale || 100);
    const texScaleY = 100 / (materialSettings.scale || 100);

    const applyScaleToTex = (tex) => {
        if (tex && tex.repeat && typeof tex.repeat.set === 'function') {
            tex.repeat.set(texScaleX, texScaleY);
        }
    };

    if (baseImg) { loadedMaps.map = loadMapManual(baseImg, true); applyScaleToTex(loadedMaps.map); }
    if (normalImg) { loadedMaps.normalMap = loadMapManual(normalImg, false); applyScaleToTex(loadedMaps.normalMap); }
    if (roughnessImg) { loadedMaps.roughnessMap = loadMapManual(roughnessImg, false); applyScaleToTex(loadedMaps.roughnessMap); }
    if (metalnessImg) { loadedMaps.metalnessMap = loadMapManual(metalnessImg, false); applyScaleToTex(loadedMaps.metalnessMap); }
    if (displacementImg) { loadedMaps.displacementMap = loadMapManual(displacementImg, false); applyScaleToTex(loadedMaps.displacementMap); }
    if (bumpImg) { loadedMaps.bumpMap = loadMapManual(bumpImg, false); applyScaleToTex(loadedMaps.bumpMap); }
    if (aoImg) { loadedMaps.aoMap = loadMapManual(aoImg, false); applyScaleToTex(loadedMaps.aoMap); }
    if (alphaImg) { loadedMaps.alphaMap = loadMapManual(alphaImg, false); applyScaleToTex(loadedMaps.alphaMap); }
    if (emissiveImg) { loadedMaps.emissiveMap = loadMapManual(emissiveImg, true); applyScaleToTex(loadedMaps.emissiveMap); }

    const targetedMeshes = isFullModel ? [] : resolveTargetMeshes(selMat);
    const targetMeshSet = new Set(targetedMeshes);

    const applyToMeshLocal = (child) => {
         if (child.isMesh && (child.material || child.userData?.__preXrayMaterial)) {
             if (!isFullModel) {
                 ensureMeshUniqueMaterial(child, targetMeshSet);
             }
             const apply = (mat) => {
                  const hasMapUpdate = newMapsList.hasOwnProperty('map') && newMapsList.map !== "existing";
                  const hasNormalUpdate = newMapsList.hasOwnProperty('normalMap') && newMapsList.normalMap !== "existing";
                  const hasRoughnessUpdate = newMapsList.hasOwnProperty('roughnessMap') && newMapsList.roughnessMap !== "existing";
                  const hasMetalnessUpdate = newMapsList.hasOwnProperty('metalnessMap') && newMapsList.metalnessMap !== "existing";
                  const hasBumpUpdate = (newMapsList.hasOwnProperty('bumpMap') && newMapsList.bumpMap !== "existing") || (newMapsList.hasOwnProperty('bump') && newMapsList.bump !== "existing");
                  const hasAoUpdate = newMapsList.hasOwnProperty('aoMap') && newMapsList.aoMap !== "existing";
                  const hasDispUpdate = (newMapsList.hasOwnProperty('displacementMap') && newMapsList.displacementMap !== "existing") || (newMapsList.hasOwnProperty('displacement') && newMapsList.displacement !== "existing");

                  if (hasMapUpdate) {
                      if (loadedMaps.map) {
                          if (mat.map !== loadedMaps.map) mat.map = loadedMaps.map;
                          if (!mat.userData.manualMaps) mat.userData.manualMaps = {};
                          mat.userData.manualMaps.map = newMapsList.map;
                      } else if (newMapsList.map === null) {
                          mat.map = null;
                          if (!mat.userData.manualMaps) mat.userData.manualMaps = {};
                          mat.userData.manualMaps.map = null;
                      }
                  }
                  
                  if (hasNormalUpdate) {
                      if (loadedMaps.normalMap) {
                          if (mat.normalMap !== loadedMaps.normalMap) mat.normalMap = loadedMaps.normalMap;
                          if (!mat.userData.manualMaps) mat.userData.manualMaps = {};
                          mat.userData.manualMaps.normalMap = newMapsList.normalMap;
                          if (mat.normalMap && !mat.normalScale) mat.normalScale = new THREE.Vector2(1, 1);
                      } else if (newMapsList.normalMap === null) {
                          mat.normalMap = null;
                          if (!mat.userData.manualMaps) mat.userData.manualMaps = {};
                          mat.userData.manualMaps.normalMap = null;
                      }
                  }
                  
                  if (hasRoughnessUpdate) {
                      if (loadedMaps.roughnessMap) {
                          if (mat.roughnessMap !== loadedMaps.roughnessMap) mat.roughnessMap = loadedMaps.roughnessMap;
                          if (!mat.userData.manualMaps) mat.userData.manualMaps = {};
                          mat.userData.manualMaps.roughnessMap = newMapsList.roughnessMap;
                          if (mat.roughnessMap) mat.roughness = 1.0;
                      } else if (newMapsList.roughnessMap === null) {
                          mat.roughnessMap = null;
                          if (!mat.userData.manualMaps) mat.userData.manualMaps = {};
                          mat.userData.manualMaps.roughnessMap = null;
                      }
                  }
                  
                  if (hasMetalnessUpdate) {
                      if (loadedMaps.metalnessMap) {
                          if (mat.metalnessMap !== loadedMaps.metalnessMap) mat.metalnessMap = loadedMaps.metalnessMap;
                          if (!mat.userData.manualMaps) mat.userData.manualMaps = {};
                          mat.userData.manualMaps.metalnessMap = newMapsList.metalnessMap;
                          if (mat.metalnessMap) mat.metalness = 1.0;
                      } else if (newMapsList.metalnessMap === null) {
                          mat.metalnessMap = null;
                          if (!mat.userData.manualMaps) mat.userData.manualMaps = {};
                          mat.userData.manualMaps.metalnessMap = null;
                      }
                  }
                  
                  if (hasDispUpdate) {
                      const dispVal = newMapsList.displacementMap || newMapsList.displacement;
                      if (loadedMaps.displacementMap) {
                          if (mat.displacementMap !== loadedMaps.displacementMap) mat.displacementMap = loadedMaps.displacementMap;
                          if (!mat.userData.manualMaps) mat.userData.manualMaps = {};
                          mat.userData.manualMaps.displacementMap = dispVal;
                          if (mat.displacementMap && mat.displacementScale === undefined) mat.displacementScale = 0.01;
                      } else if (dispVal === null) {
                          mat.displacementMap = null;
                          if (!mat.userData.manualMaps) mat.userData.manualMaps = {};
                          mat.userData.manualMaps.displacementMap = null;
                      }
                  }

                  if (hasBumpUpdate) {
                      const bumpVal = newMapsList.bumpMap || newMapsList.bump;
                      if (loadedMaps.bumpMap) {
                          if (mat.bumpMap !== loadedMaps.bumpMap) mat.bumpMap = loadedMaps.bumpMap;
                          if (!mat.userData.manualMaps) mat.userData.manualMaps = {};
                          mat.userData.manualMaps.bumpMap = bumpVal;
                          if (mat.bumpMap && mat.bumpScale === undefined) mat.bumpScale = 0.05;
                      } else if (bumpVal === null) {
                          mat.bumpMap = null;
                          if (!mat.userData.manualMaps) mat.userData.manualMaps = {};
                          mat.userData.manualMaps.bumpMap = null;
                      }
                  }
                  
                  if (hasAoUpdate) {
                      if (loadedMaps.aoMap) {
                          if (mat.aoMap !== loadedMaps.aoMap) mat.aoMap = loadedMaps.aoMap;
                          if (!mat.userData.manualMaps) mat.userData.manualMaps = {};
                          mat.userData.manualMaps.aoMap = newMapsList.aoMap;
                          if (mat.aoMap && mat.aoMapIntensity === undefined) mat.aoMapIntensity = 1;
                      } else if (newMapsList.aoMap === null) {
                          mat.aoMap = null;
                          if (!mat.userData.manualMaps) mat.userData.manualMaps = {};
                          mat.userData.manualMaps.aoMap = null;
                      }
                  }

                  if (newMapsList.hasOwnProperty('alphaMap') && newMapsList.alphaMap !== "existing") {
                      if (loadedMaps.alphaMap) {
                          if (mat.alphaMap !== loadedMaps.alphaMap) mat.alphaMap = loadedMaps.alphaMap;
                          if (!mat.userData.manualMaps) mat.userData.manualMaps = {};
                          mat.userData.manualMaps.alphaMap = newMapsList.alphaMap;
                      } else if (newMapsList.alphaMap === null) {
                          mat.alphaMap = null;
                          if (!mat.userData.manualMaps) mat.userData.manualMaps = {};
                          mat.userData.manualMaps.alphaMap = null;
                      }
                  }

                  if (newMapsList.hasOwnProperty('emissiveMap') && newMapsList.emissiveMap !== "existing") {
                      if (loadedMaps.emissiveMap) {
                          if (mat.emissiveMap !== loadedMaps.emissiveMap) mat.emissiveMap = loadedMaps.emissiveMap;
                          if (!mat.userData.manualMaps) mat.userData.manualMaps = {};
                          mat.userData.manualMaps.emissiveMap = newMapsList.emissiveMap;
                      } else if (newMapsList.emissiveMap === null) {
                          mat.emissiveMap = null;
                          if (!mat.userData.manualMaps) mat.userData.manualMaps = {};
                          mat.userData.manualMaps.emissiveMap = null;
                      }
                  }
                  
                  mat.needsUpdate = true;
             };

             if (Array.isArray(child.material)) {
                 child.material.forEach(apply);
             } else {
                 apply(child.material);
             }
         }
    };

    const applyToTarget = (meshes) => {
        meshes.forEach(applyToMeshLocal);
    };

    if (isFullModel) {
        meshIndexRef.current.forEach(applyToTarget);
    } else {
        const targetMeshes = resolveTargetMeshes(selMat);
        applyToTarget(targetMeshes);
    }

  }, [materialSettings?.maps, materialSettings?.useFactorColor, scene, selectedMaterial, modelName, resolveTargetMeshes]);

  // 0.6. Sync UI with Selected Material (Fetch existing values)


  // 0.5 Detect Current Texture on Selection Change
  useEffect(() => {
      if (!scene) return;

      const isFullModel = !selectedMaterial || (modelName && selectedMaterial.name === modelName) || selectedMaterial.name === "Scene";
      
      let foundMat = null;

      if (!isFullModel) {
          const targetParentGroup = selectedMaterial.parentGroup;
          if (targetParentGroup && targetParentGroup !== modelName && targetParentGroup !== "Scene") {
              onTextureIdentifiedRef.current?.(null);
              return;
          }
          if (selectedMaterial.isGroup && selectedMaterial.name !== modelName && selectedMaterial.name !== "Scene") {
              onTextureIdentifiedRef.current?.(null);
              return;
          }
      }
      
      foundMat = resolveTargetMaterial(selectedMaterial);

      // Helper to extract URL from a Three.js Texture
      const getTexUrl = (tex) => {
          return getTextureSource(tex) || "existing";
      };

      if (foundMat && foundMat.userData && foundMat.userData.appliedTextureId) {
          onTextureIdentifiedRef.current?.(foundMat.userData.appliedTextureId);
      } else {
          onTextureIdentifiedRef.current?.(null);
      }

      // Sync Manual Maps or Original Model Maps back to UI (Detected but not re-applied)
      if (foundMat) {
          if (foundMat.userData && foundMat.userData.manualMaps) {
              onUpdateMaterialSettingRef.current?.('maps', foundMat.userData.manualMaps);
          } else {
              // Extract current visual state for the UI checkmarks
              const nativeMaps = {};

              if (foundMat.map) nativeMaps.map = getTexUrl(foundMat.map);
              if (foundMat.normalMap) nativeMaps.normalMap = getTexUrl(foundMat.normalMap);
              if (foundMat.roughnessMap) nativeMaps.roughnessMap = getTexUrl(foundMat.roughnessMap);
              if (foundMat.metalnessMap) nativeMaps.metalnessMap = getTexUrl(foundMat.metalnessMap);
              if (foundMat.displacementMap) nativeMaps.displacementMap = getTexUrl(foundMat.displacementMap);
              if (foundMat.bumpMap) nativeMaps.bumpMap = getTexUrl(foundMat.bumpMap);
              if (foundMat.aoMap) nativeMaps.aoMap = getTexUrl(foundMat.aoMap);
              if (foundMat.alphaMap) nativeMaps.alphaMap = getTexUrl(foundMat.alphaMap);
              if (foundMat.emissiveMap) nativeMaps.emissiveMap = getTexUrl(foundMat.emissiveMap);

              onUpdateMaterialSettingRef.current?.('maps', nativeMaps);
          }
      } else {
          onUpdateMaterialSettingRef.current?.('maps', {});
      }

  }, [selectedMaterial, scene, modelName, resolveTargetMaterial]);
  
  // 1. Initial Setup: Centering, Scaling, Stats, Material Naming
  useLayoutEffect(() => {
    if (!scene) return;

    // Reset position and scale to calculate true bounding box
    scene.position.set(0, 0, 0);
    scene.scale.set(1, 1, 1);
    scene.rotation.set(0, 0, 0);
    scene.updateMatrixWorld(true);

    let box = new THREE.Box3();
    
    // Compute accurate bounding box from all renderable geometry
    scene.traverse((child) => {
      if (child.isSkinnedMesh) {
        try {
          child.computeBoundingBox();
          if (child.boundingBox) {
            const skinnedBox = child.boundingBox.clone().applyMatrix4(child.matrixWorld);
            if (!skinnedBox.isEmpty() && isFinite(skinnedBox.min.x)) {
              box.union(skinnedBox);
              return;
            }
          }
        } catch (_) {}
      }
      if (child.isMesh && child.geometry) {
        if (!child.geometry.boundingBox) child.geometry.computeBoundingBox();
        if (child.geometry.boundingBox) {
          const geomBox = child.geometry.boundingBox.clone().applyMatrix4(child.matrixWorld);
          if (!geomBox.isEmpty() && isFinite(geomBox.min.x)) {
            box.union(geomBox);
          }
        }
      }
    });

    if (box.isEmpty()) {
      try {
        box.setFromObject(scene);
      } catch (e) {
        console.warn("[GenericModel] Bounding box computation notice:", e);
      }
    }

    if (box.isEmpty() || !isFinite(box.min.x)) {
      box.min.set(-1, -1, -1);
      box.max.set(1, 1, 1);
    }

    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    
    box.getSize(size);
    box.getCenter(center);

    const maxDim = Math.max(size.x, size.y, size.z);
    
    // Target size 3.5 units for clear, large, prominent framing in the viewport
    const TARGET_SIZE = 3.5;
    let targetScale = maxDim > 0 ? (TARGET_SIZE / maxDim) : 1;

    // Center on X and Z, and place the bottom at exactly Y = 0 on the base grid (no floating)
    const centeredX = -center.x * targetScale;
    const centeredZ = -center.z * targetScale;
    const bottomY = -box.min.y * targetScale; 

    // DO NOT scale or move the child scene directly to prevent double-scaling!
    // The parent <group> handles scale and position cleanly.
    scene.position.set(0, 0, 0);
    scene.scale.set(1, 1, 1);
    scene.updateMatrixWorld(true);

    setScale(targetScale);
    setPosition([centeredX, bottomY, centeredZ]);
    
    // Persistent storage of normalization baseline on the scene object itself
    scene.userData.normalization = {
        position: [centeredX, bottomY, centeredZ],
        scale: targetScale
    };
    if (modelGroup) {
        modelGroup.userData.originalTransform = {
            position: new THREE.Vector3(centeredX, bottomY, centeredZ),
            rotation: new THREE.Euler(0, 0, 0),
            scale: new THREE.Vector3(targetScale, targetScale, targetScale)
        };
    }

    // Stats & Material Naming
    let vertCount = 0;
    let polyCount = 0;
    const processedMaterials = new Map();
    const usedNames = new Set();
    let unnamedCount = 1;

    const groupMap = new Map(); // GroupName -> Set<MaterialName>
    const ungroupedMats = new Set();
    const meshIndex = new Map();

    scene.traverse((child) => {
      if (child.isMesh || child.isSkinnedMesh) {
        if (!child.userData.originalTransform) {
          child.userData.originalTransform = {
            position: child.position.clone(),
            rotation: child.rotation.clone(),
            scale: child.scale.clone()
          };
        }
        if (child.geometry) {
          if (!child.geometry.boundingSphere) {
            child.geometry.computeBoundingSphere();
          }
          child.frustumCulled = !child.isSkinnedMesh;
        }
        // Build Mesh Index for fast lookups later
        if (child.material) {
            if (Array.isArray(child.material)) {
                child.material = child.material.map(ensurePhysicalMaterial);
            } else {
                child.material = ensurePhysicalMaterial(child.material);
            }
            const mats = Array.isArray(child.material) ? child.material : [child.material];
            mats.forEach(m => {
                const name = m.name || m.uuid; // Use name if set, otherwise uuid as fallback
                if (!meshIndex.has(name)) meshIndex.set(name, []);
                meshIndex.get(name).push(child);
            });
        }
        // Also register mesh uuid and mesh name in meshIndex for instant direct lookups
        if (child.uuid) {
            if (!meshIndex.has(child.uuid)) meshIndex.set(child.uuid, []);
            meshIndex.get(child.uuid).push(child);
        }
        if (child.name) {
            if (!meshIndex.has(child.name)) meshIndex.set(child.name, []);
            meshIndex.get(child.name).push(child);
        }

        child.castShadow = true;
        child.receiveShadow = true;

        // Geometry Stats
        const geom = child.geometry;
        if (geom) {
          const newGeom = child.geometry;
          // Recalculate normals ONLY if they are missing
          if (!newGeom.attributes.normal) {
              newGeom.computeVertexNormals();
          }

          // AUTO-UNWRAP: If model has no UVs, apply default Box Mapping immediately
          if (!newGeom.attributes.uv) {
              applyBoxUV(child);
          }

          // Compute tangents safely for smooth normal mapping if UVs exist and they don't already exist
          safeComputeTangents(newGeom);

          if (newGeom.attributes.normal) newGeom.attributes.normal.needsUpdate = true;

          vertCount += newGeom.attributes.position.count;
          if (newGeom.index) {
            polyCount += newGeom.index.count / 3;
          } else {
            polyCount += newGeom.attributes.position.count / 3;
          }
        }
        
        // Material Naming & Grouping logic
        if (child.material) {
            
            // Determine Group Name
            let groupName = null;
            if (child.parent && child.parent.isGroup && child.parent.name && child.parent.name !== 'Scene') {
                 groupName = child.parent.name;
            }

            const processMat = (m) => {
                let uniqueName = processedMaterials.get(m.uuid);

                if (!uniqueName) {
                    let name = m.name; 
                    if (!name || name.trim() === '') {
                        const suffix = String(unnamedCount++).padStart(2, '0');
                        name = `Material_${suffix}`;
                    }
                    
                    name = name.replace(/[:|]/g, " ").trim();
                    
                    uniqueName = name;
                    let conflictCount = 1;
                    while (usedNames.has(uniqueName)) {
                        uniqueName = `${name}_${String(conflictCount++).padStart(2, '0')}`;
                    }
                    
                    m.name = uniqueName;
                    processedMaterials.set(m.uuid, uniqueName);
                    usedNames.add(uniqueName);

                    // Ensure original transparency/depth write data is captured before modifying
                    const isLikelyCutoutM = /fringe|tassel|cutout|thread|strand|leaf|foliage|hair|fur|trans|alpha/i.test(`${child.name || ''}_${m.name || ''}`);
                    const hasAlphaMapM = Boolean(m.alphaMap);
                    const hasCutoutM = (m.alphaTest !== undefined && m.alphaTest > 0) || isLikelyCutoutM;
                    const isExplicitlyPartialOpacityM = (m.opacity !== undefined && m.opacity < 0.999);
                    const isTrulyTransparentM = isExplicitlyPartialOpacityM || hasAlphaMapM;

                    m.transparent = isTrulyTransparentM;
                    m.depthWrite = true;

                    if (hasCutoutM) {
                        m.alphaTest = (m.alphaTest !== undefined && m.alphaTest > 0) ? m.alphaTest : 0.5;
                        m.transparent = false;
                        m.depthWrite = true;
                    }

                    if (m.userData.originalAlphaTest === undefined) {
                        m.userData.originalAlphaTest = m.alphaTest || 0;
                    }
                    if (m.userData.originalTransparent === undefined) m.userData.originalTransparent = isTrulyTransparentM;
                    if (m.userData.originalDepthWrite === undefined) m.userData.originalDepthWrite = true;
                    if (m.userData.originalSide === undefined) m.userData.originalSide = m.side !== undefined ? m.side : THREE.DoubleSide;

                    // Ensure both sides are visible and depth write is always enabled to prevent hollow/merging artifacts
                    m.side = THREE.DoubleSide;
                    m.depthWrite = true;

                    // Ensure original data is stored for visibility/UI logic
                    if (!m.userData.originalColor && m.color) {
                        if ((m.map || m.alphaMap || (m.alphaTest > 0) || isLikelyCutoutM) && m.color.r < 0.05 && m.color.g < 0.05 && m.color.b < 0.05) {
                            m.color.setRGB(1, 1, 1);
                        }
                        m.userData.originalColor = m.color.clone();
                    }
                    if (m.userData.originalOpacity === undefined) m.userData.originalOpacity = m.opacity;
                    if (m.userData.originalRoughness === undefined) m.userData.originalRoughness = m.roughness;
                    if (m.userData.originalMetalness === undefined) m.userData.originalMetalness = m.metalness;
                    if (m.userData.originalClearcoat === undefined) m.userData.originalClearcoat = m.clearcoat !== undefined ? m.clearcoat : 0;
                    if (m.userData.originalSpecularIntensity === undefined) m.userData.originalSpecularIntensity = m.specularIntensity !== undefined ? m.specularIntensity : 1.0;
                    if (m.userData.originalEnvMapIntensity === undefined) m.userData.originalEnvMapIntensity = m.envMapIntensity !== undefined ? m.envMapIntensity : 1.0;
                    if (m.map && !m.userData.originalMap) m.userData.originalMap = m.map;
                    if (m.normalMap && !m.userData.originalNormalMap) m.userData.originalNormalMap = m.normalMap;
                    if (m.roughnessMap && !m.userData.originalRoughnessMap) m.userData.originalRoughnessMap = m.roughnessMap;
                    if (m.metalnessMap && !m.userData.originalMetalnessMap) m.userData.originalMetalnessMap = m.metalnessMap;
                    if (m.aoMap && !m.userData.originalAoMap) m.userData.originalAoMap = m.aoMap;
                    if (m.alphaMap && !m.userData.originalAlphaMap) m.userData.originalAlphaMap = m.alphaMap;
                }

                // Add to Group or Ungrouped
                if (groupName) {
                    if (!groupMap.has(groupName)) groupMap.set(groupName, new Set());
                    groupMap.get(groupName).add(uniqueName);
                } else {
                    ungroupedMats.add(uniqueName);
                }
            };

            if (Array.isArray(child.material)) {
                child.material.forEach(processMat);
            } else {
                processMat(child.material);
            }
        }
      }
    });

    meshIndexRef.current = meshIndex;

    // Filter Ungrouped Materials
    const allGroupedMaterialNames = new Set();
    groupMap.forEach((matSet) => {
        matSet.forEach(name => allGroupedMaterialNames.add(name));
    });

    for (const name of ungroupedMats) {
        if (allGroupedMaterialNames.has(name)) {
            ungroupedMats.delete(name);
        }
    }

    // Build recursive scene hierarchy tree (Folder & Mesh tree)
    const buildHierarchyNode = (obj) => {
      if (!obj) return null;
      if (
        obj.isLight ||
        obj.isCamera ||
        obj.isHelper ||
        obj.name?.toLowerCase().includes("transformcontrols") ||
        obj.name?.toLowerCase().includes("gizmo")
      ) {
        return null;
      }

      const isMesh = obj.isMesh || obj.isSkinnedMesh || obj.isLine || obj.isPoints;
      const childNodes = [];

      if (obj.children && obj.children.length > 0) {
        for (const child of obj.children) {
          const childTree = buildHierarchyNode(child);
          if (childTree) {
            if (Array.isArray(childTree)) childNodes.push(...childTree);
            else childNodes.push(childTree);
          }
        }
      }

      if (isMesh) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        const matNames = mats.map((m, idx) => {
          if (!m) return null;
          if (!m.name) m.name = `Material_${idx + 1}`;
          return m.name;
        }).filter(Boolean);
        const primaryMat = matNames[0] || "Default";
        const meshName = (obj.name && obj.name !== "Scene") ? obj.name : primaryMat;

        return {
          id: obj.uuid,
          name: meshName,
          isMesh: true,
          isGroup: false,
          material: primaryMat,
          materials: matNames,
          meshUuid: obj.uuid,
          children: childNodes
        };
      }

      if (childNodes.length > 0) {
        const allDescendantMaterials = new Set();
        const collectDescendantMats = (nodeItem) => {
          if (nodeItem.materials) nodeItem.materials.forEach((m) => allDescendantMaterials.add(m));
          if (nodeItem.children) nodeItem.children.forEach(collectDescendantMats);
        };
        childNodes.forEach(collectDescendantMats);

        const groupName = (obj.name && obj.name !== "Scene") ? obj.name : "Group";

        return {
          id: obj.uuid,
          name: groupName,
          isMesh: false,
          isGroup: true,
          materials: Array.from(allDescendantMaterials),
          children: childNodes
        };
      }

      return null;
    };

    // Simplify single-child redundant dummy wrapper nodes (e.g. RootNode -> FBX_Root)
    const simplifyHierarchy = (nodes) => {
      if (!Array.isArray(nodes)) return [];

      const isGenericWrapper = (name) => /^(rootnode|root|scene|object3d|sketchfab_model|model|group_\d+|null)$/i.test((name || "").trim());

      const cleanNode = (n) => {
        if (!n) return null;
        if (n.isMesh) return n;

        let cleanChildren = [];
        if (n.children && n.children.length > 0) {
          n.children.forEach((c) => {
            const cleaned = cleanNode(c);
            if (cleaned) {
              if (Array.isArray(cleaned)) cleanChildren.push(...cleaned);
              else cleanChildren.push(cleaned);
            }
          });
        }

        if (cleanChildren.length === 0) return null;

        // Unwrap repeated single-child group chains: e.g. A -> B -> C -> D -> Mesh
        let currentNodeName = n.name;
        while (cleanChildren.length === 1 && cleanChildren[0].isGroup) {
          const onlyChild = cleanChildren[0];
          if (!isGenericWrapper(currentNodeName) && isGenericWrapper(onlyChild.name)) {
            onlyChild.name = currentNodeName;
          }
          cleanChildren = onlyChild.children || [];
        }

        if (isGenericWrapper(currentNodeName) && cleanChildren.length === 1) {
          return cleanChildren[0];
        }

        return {
          ...n,
          name: currentNodeName,
          children: cleanChildren
        };
      };

      const result = [];
      nodes.forEach((n) => {
        const cleaned = cleanNode(n);
        if (cleaned) {
          if (Array.isArray(cleaned)) result.push(...cleaned);
          else result.push(cleaned);
        }
      });
      return result;
    };

    // Extract root hierarchy nodes
    const rawHierarchy = [];
    if (scene.children && scene.children.length > 0) {
      for (const rootChild of scene.children) {
        const node = buildHierarchyNode(rootChild);
        if (node) {
          if (Array.isArray(node)) rawHierarchy.push(...node);
          else rawHierarchy.push(node);
        }
      }
    }

    const fullHierarchy = simplifyHierarchy(rawHierarchy);

    // Extract deep material data for property panel initialization
    const materialDataMap = {};
    scene.traverse((child) => {
      if (child.isMesh && child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((m, mIdx) => {
          if (!m) return;
          if (!m.name) m.name = `Material_${mIdx + 1}`;

          // Ensure all surface textures on the material have RepeatWrapping enabled
          // so texture transforms (offset, scale, rotation) tile smoothly and never clamp to black edges
          [m.map, m.normalMap, m.roughnessMap, m.metalnessMap, m.bumpMap, m.displacementMap, m.alphaMap, m.emissiveMap].forEach(t => {
            if (t && t !== m.aoMap && t !== m.lightMap) {
              t.wrapS = THREE.RepeatWrapping;
              t.wrapT = THREE.RepeatWrapping;
            }
          });

          if (!m.userData.originalMap && m.map) m.userData.originalMap = m.map;
          if (!m.userData.originalNormalMap && m.normalMap) m.userData.originalNormalMap = m.normalMap;
          if (!m.userData.originalAlphaMap && m.alphaMap) m.userData.originalAlphaMap = m.alphaMap;

          if (!materialDataMap[m.name]) {
            const extractTexture = (tex) => getTextureSource(tex);
            const nativeMaps = {};
            const baseSrc = extractTexture(m.map);
            if (baseSrc) nativeMaps.map = baseSrc;
            const normSrc = extractTexture(m.normalMap);
            if (normSrc) nativeMaps.normalMap = normSrc;
            const roughSrc = extractTexture(m.roughnessMap);
            if (roughSrc) nativeMaps.roughnessMap = roughSrc;
            const metalSrc = extractTexture(m.metalnessMap);
            if (metalSrc) nativeMaps.metalnessMap = metalSrc;
            const emissiveSrc = extractTexture(m.emissiveMap);
            if (emissiveSrc) nativeMaps.emissiveMap = emissiveSrc;
            const aoSrc = extractTexture(m.aoMap);
            if (aoSrc) nativeMaps.aoMap = aoSrc;
            const bumpSrc = extractTexture(m.bumpMap);
            if (bumpSrc) nativeMaps.bumpMap = bumpSrc;
            const dispSrc = extractTexture(m.displacementMap);
            if (dispSrc) nativeMaps.displacementMap = dispSrc;
            const alphaSrc = extractTexture(m.alphaMap);
            if (alphaSrc) nativeMaps.alphaMap = alphaSrc;

            const data = {
              color: '#' + (m.color ? m.color.getHexString() : 'ffffff'),
              metallic: m.metalness !== undefined ? m.metalness * 100 : 0,
              roughness: m.roughness !== undefined ? m.roughness * 100 : 50,
              opacity: m.opacity !== undefined ? m.opacity * 100 : 100,
              scale: m.map && m.map.repeat ? Math.round(100 / (m.map.repeat.x || 1)) : 100,
              maps: nativeMaps
            };
            materialDataMap[m.name] = data;
            if (child.name && !materialDataMap[child.name]) {
              materialDataMap[child.name] = data;
            }
            if (child.uuid && !materialDataMap[child.uuid]) {
              materialDataMap[child.uuid] = data;
            }
          }
        });
      }
    });

    if (fullHierarchy.length > 0) {
      if (typeof setMaterialList === 'function') setMaterialList(fullHierarchy, materialDataMap);
    } else {
      if (typeof setMaterialList === 'function') setMaterialList(Array.from(ungroupedMats).sort(), materialDataMap);
    }

    if (typeof setModelStats === 'function') {
        setModelStats({
            vertexCount: vertCount.toLocaleString(),
            polygonCount: Math.round(polyCount).toLocaleString(),
            materialCount: processedMaterials.size,
            dimensions: `${Math.round(size.x * 100) / 100} X ${Math.round(size.y * 100) / 100} X ${Math.round(size.z * 100) / 100} unit`
        });
    }

    if (typeof onModelReady === 'function') {
        const boundsPayload = {
            box: box.clone(),
            size: size.clone(),
            center: center.clone(),
            targetScale,
            maxDim: maxDim * targetScale,
            height: size.y * targetScale,
            width: size.x * targetScale,
            depth: size.z * targetScale
        };
        // Double RAF ensures Three.js has committed geometry transforms and rendered the frame
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                onModelReady(boundsPayload);
            });
        });
    }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene]);

  // 2. Wireframe Update Effect
  useLayoutEffect(() => {
      if (!scene) return;
      meshIndexRef.current.forEach(meshes => {
          meshes.forEach(child => {
              if (child.isMesh && child.material) {
                  if (Array.isArray(child.material)) {
                      child.material.forEach(m => m.wireframe = wireframe);
                  } else {
                      child.material.wireframe = wireframe;
                  }
              }
          });
      });
  }, [scene, wireframe]);

  // 3. Material Highlight Effect (Emissive flashing disabled in favor of clean silhouette outline)
  useEffect(() => {
    // Disabled whole-mesh emissive flashing so selected mesh retains its original material and is highlighted by silhouette outline only
  }, [scene, selectedMaterial, modelName]);

  // 3.5. Apply Material Settings (Factor Adjustment)
  // 4. Determine Transform Target
  const [transformTarget, setTransformTarget] = useState(null);
  
  // Use Ref to access latest selection inside effects without triggering them
  const selectedMaterialRef = React.useRef(selectedMaterial);
  selectedMaterialRef.current = selectedMaterial;

  // 3.5. Apply Material Settings (Factor Adjustment - Scope Aware)
  // 3.5. New Approach: Split Load (Selection -> UI) and Apply (UI -> Material)



  const lastMaterialResetKeyRef = React.useRef(resetKey);
  const lastApplyResetKeyRef = React.useRef(resetKey);
  const lastMapResetKeyRef = React.useRef(resetKey);

  // A. Load Settings when Selection Changes
  useEffect(() => {
    if (!scene || xrayMode) return;
    
    // When resetKey changes (Undo, Redo, or Reset), skip loading from mesh 
    // so we don't overwrite the restored materialSettings!
    if (resetKey !== lastMaterialResetKeyRef.current) {
        lastMaterialResetKeyRef.current = resetKey;
        const sig = `${modelName || ''}_${selectedMaterial ? (selectedMaterial.uuid || selectedMaterial.name) : 'FULL'}`;
        setSyncedSelectionSignature(sig);
        return;
    }
    
    const selMat = selectedMaterial;
    const targetMatName = selMat ? selMat.name : (modelName || "Scene");
    const isFullModel = !selMat || targetMatName === modelName || targetMatName === "Scene";

    let foundMat = resolveTargetMaterial(selMat);

    if (foundMat) {
        const m = foundMat;

        const safeUpdate = (key, val) => {
            // Do not sync emissive properties to UI while the material is flashing red/white
            // to avoid overwriting user settings with temporary highlight colors.
            if (m.userData.isFlashing && (key === 'emissiveColor' || key === 'emissiveIntensity')) return;
            
            if (onUpdateMaterialSettingRef.current) {
                onUpdateMaterialSettingRef.current(key, val, true); // true = sync from model
            }
        };

        // Sync basic properties
        if (m.color && typeof m.color.getHexString === 'function') {
            safeUpdate('color', '#' + m.color.getHexString());
        }
        
        if (m.isMeshStandardMaterial || m.isMeshPhysicalMaterial) {
            safeUpdate('metallic', Math.round((m.metalness || 0) * 100));
            safeUpdate('roughness', Math.round((m.roughness || 0) * 100));
        } else if (m.isMeshPhongMaterial) {
            safeUpdate('metallic', Math.round((m.shininess || 0) / 100 * 100));
            safeUpdate('roughness', 0);
        }

        if (m.opacity !== undefined) {
            safeUpdate('alpha', Math.round(m.opacity * 100));
        }

        // Sync intensity and emissive
        safeUpdate('colorIntensity', 100); 
        if (m.emissiveIntensity !== undefined) {
            safeUpdate('emissiveIntensity', Math.round(m.emissiveIntensity * 100));
        }
        if (m.emissive && typeof m.emissive.getHexString === 'function') {
            safeUpdate('emissiveColor', '#' + m.emissive.getHexString());
        }

        // Sync scales - ensure symmetry with Apply effect
        if (m.normalMap && m.normalScale) {
            safeUpdate('normal', Math.round(m.normalScale.x * 100));
        }
        
        // Bump/Disp scale sync
        if (m.displacementMap && m.displacementScale !== undefined) {
            safeUpdate('bump', Math.round(m.displacementScale * 100));
        } else if (m.bumpMap && m.bumpScale !== undefined) {
            safeUpdate('bump', Math.round(m.bumpScale / 10 * 100));
        }

        // Texture transformations: Only sync if not in 3D transform mode and texture is present
        if (!transformMode) {
            const tex = m.map || m.normalMap || m.roughnessMap;
            if (tex) {
                if (m.userData.__textureScale !== undefined) {
                    safeUpdate('scale', m.userData.__textureScale);
                } else if (tex.repeat && (tex.repeat.x !== 1 || tex.repeat.y !== 1)) {
                    safeUpdate('scale', Math.round(100 / (tex.repeat.x || 1)));
                }
                if (tex.rotation !== undefined && tex.rotation !== 0) {
                    safeUpdate('rotation', Math.round(tex.rotation * (180 / Math.PI)));
                }
                if (tex.offset && (tex.offset.x !== 0 || tex.offset.y !== 0)) {
                    safeUpdate('offset', { x: tex.offset.x * 100, y: tex.offset.y * 100 });
                }
            }
        }

        // Sync applied texture info if available
        if (m.userData.appliedTexture) {
            safeUpdate('appliedTexture', m.userData.appliedTexture);
        } else {
            safeUpdate('appliedTexture', null);
        }
    }

    // Capture signature to allow B effect to run safely
    const sig = `${modelName || ''}_${selMat ? (selMat.uuid || selMat.name) : 'FULL'}`;
    setSyncedSelectionSignature(sig);

  }, [selectedMaterial, scene, modelName, resolveTargetMaterial, transformMode]); 

  // B. Apply Settings when UI changes
  useEffect(() => {
    if (!scene || !materialSettings || xrayMode) return;

    const selMat = selectedMaterial; 
    const targetMatName = selMat ? selMat.name : (modelName || "Scene");
    const isFullModel = !selMat || targetMatName === modelName || targetMatName === "Scene";
    
    const isResetOrUndo = resetKey !== lastApplyResetKeyRef.current;
    lastApplyResetKeyRef.current = resetKey;

    // Guard: Prevent applying stale material settings if the selection has changed 
    // but the UI hasn't synced with the model's current state yet.
    const currentSig = `${modelName || ''}_${selMat ? (selMat.uuid || selMat.name) : 'FULL'}`;
    if (!isResetOrUndo && syncedSelectionSignature && syncedSelectionSignature !== currentSig) {
        return;
    }

    // CRITICAL: Prevent overwriting 3D materials when useFactorColor is false!
    // Material factors must ONLY be pushed to the 3D model if the user actively modified material factors
    // (useFactorColor === true). When undoing or resetting back to uncolored state, restore original properties!
    if (!materialSettings.useFactorColor) {
        if (isResetOrUndo) {
            const targetedMeshes = resolveTargetMeshes(selMat);
            const targetMeshSet = new Set(targetedMeshes);

            scene.traverse((child) => {
                if (child.isMesh && child.material) {
                    const isTargetChild = isFullModel ? true : targetMeshSet.has(child);
                    if (!isTargetChild) return;

                    const materials = Array.isArray(child.material) ? child.material : [child.material];
                    materials.forEach(m => {
                        let isMatch = true;

                        if (isMatch) {
                            // 1. RESTORE ALL ORIGINAL GLTF MAPS (only if valid Three.js Texture)
                            if (m.userData.originalMap?.isTexture) m.map = m.userData.originalMap;
                            if (m.userData.originalNormalMap?.isTexture) m.normalMap = m.userData.originalNormalMap;
                            if (m.userData.originalRoughnessMap?.isTexture) m.roughnessMap = m.userData.originalRoughnessMap;
                            if (m.userData.originalMetalnessMap?.isTexture) m.metalnessMap = m.userData.originalMetalnessMap;
                            if (m.userData.originalAoMap?.isTexture) m.aoMap = m.userData.originalAoMap;
                            if (m.userData.originalAlphaMap?.isTexture) m.alphaMap = m.userData.originalAlphaMap;
                            if (m.userData.originalEmissiveMap?.isTexture) m.emissiveMap = m.userData.originalEmissiveMap;
                            if (m.userData.originalBumpMap?.isTexture) m.bumpMap = m.userData.originalBumpMap;
                            if (m.userData.originalDisplacementMap?.isTexture) m.displacementMap = m.userData.originalDisplacementMap;

                            m.userData.appliedTexture = null;
                            m.userData.appliedTextureId = null;
                            m.userData.appliedMap = null;

                            // 2. RESTORE DIFFUSE COLOR:
                            // If mesh has a texture map, diffuse multiplier must be white (1,1,1) or non-black originalColor
                            // so textures render vividly and never become a pitch black silhouette!
                            const isCutoutMat = /fringe|tassel|cutout|thread|strand|leaf|foliage|hair|fur|trans|alpha/i.test(`${child.name || ''}_${m.name || ''}`);
                            const hasTexture = m.map || m.userData.originalMap || m.alphaMap || m.userData.originalAlphaMap || isCutoutMat;
                            
                            let origCol = null;
                            if (m.userData.originalColor) {
                                try {
                                    if (m.userData.originalColor.isColor) {
                                        origCol = m.userData.originalColor;
                                    } else if (typeof m.userData.originalColor === 'string') {
                                        origCol = new THREE.Color(m.userData.originalColor);
                                    } else if (typeof m.userData.originalColor === 'object' && typeof m.userData.originalColor.r === 'number') {
                                        origCol = new THREE.Color(m.userData.originalColor.r, m.userData.originalColor.g, m.userData.originalColor.b);
                                    }
                                } catch (_) {}
                            }
                            const isNonBlack = origCol && (origCol.r > 0.05 || origCol.g > 0.05 || origCol.b > 0.05);

                            if (hasTexture) {
                                if (isNonBlack) {
                                    m.color.copy(origCol);
                                } else {
                                    m.color.setRGB(1, 1, 1);
                                    m.userData.originalColor = new THREE.Color(1, 1, 1);
                                }
                            } else if (isNonBlack) {
                                m.color.copy(origCol);
                            } else {
                                m.color.setRGB(1, 1, 1);
                                m.userData.originalColor = new THREE.Color(1, 1, 1);
                            }

                            if (m.userData.originalRoughness !== undefined) {
                                m.roughness = m.userData.originalRoughness;
                            }
                            if (m.userData.originalMetalness !== undefined) {
                                m.metalness = m.userData.originalMetalness;
                            }
                            if (m.userData.originalOpacity !== undefined) {
                                m.opacity = m.userData.originalOpacity;
                            }

                            // 3. RESTORE ALPHA CUTOUT & TRANSPARENCY:
                            if (m.userData.originalAlphaTest !== undefined && m.userData.originalAlphaTest > 0) {
                                m.alphaTest = m.userData.originalAlphaTest;
                            } else if (m.alphaMap || isCutoutMat) {
                                m.alphaTest = 0.5;
                            } else if (m.userData.originalAlphaTest !== undefined) {
                                m.alphaTest = m.userData.originalAlphaTest;
                            }
                            if (m.userData.originalTransparent !== undefined) {
                                m.transparent = m.userData.originalTransparent;
                            }
                            if (m.userData.originalDepthWrite !== undefined) {
                                m.depthWrite = m.userData.originalDepthWrite;
                            }
                            if (m.userData.originalSide !== undefined) {
                                m.side = m.userData.originalSide;
                            }

                            if (m.userData.originalSpecularIntensity !== undefined) {
                                m.specularIntensity = m.userData.originalSpecularIntensity;
                            } else {
                                m.specularIntensity = 1.0;
                            }
                            if (m.userData.originalEnvMapIntensity !== undefined) {
                                m.envMapIntensity = m.userData.originalEnvMapIntensity;
                            } else {
                                m.envMapIntensity = 1.0;
                            }
                            if (m.userData.originalClearcoat !== undefined) {
                                m.clearcoat = m.userData.originalClearcoat;
                            }
                            if (m.specularColor) {
                                m.specularColor.setRGB(1, 1, 1);
                            }

                            // 3. RESTORE TEXTURE UV MATRIX (REPEAT / OFFSET)
                            const surfaceTextures = [m.map, m.normalMap, m.roughnessMap, m.metalnessMap, m.displacementMap, m.bumpMap, m.alphaMap, m.emissiveMap];
                            surfaceTextures.forEach(tex => {
                                if (tex && tex.isTexture) {
                                    if (!tex.matrix || !tex.matrix.elements) tex.matrix = new THREE.Matrix3();
                                    if (tex.repeat && typeof tex.repeat.set === 'function') tex.repeat.set(1, 1);
                                    if (tex.offset && typeof tex.offset.set === 'function') tex.offset.set(0, 0);
                                    if (tex.rotation !== undefined) tex.rotation = 0;
                                    if (tex.center && typeof tex.center.set === 'function') tex.center.set(0, 0);
                                    tex.matrixAutoUpdate = true;
                                    if (typeof tex.updateMatrix === 'function') tex.updateMatrix();
                                }
                            });

                            m.needsUpdate = true;
                        }
                    });
                }
            });
        }
        return;
    }

    const changedProp = materialSettings.lastChangedProp;
    
    const alpha = (materialSettings.alpha ?? 100) / 100;
    const metallic = (materialSettings.metallic ?? 0) / 100;
    const roughness = (materialSettings.roughness ?? 50) / 100;
    const normalScaleVal = (materialSettings.normal ?? 100) / 100;
    const bumpScaleVal = (materialSettings.bump ?? 100) / 100;
    const color = materialSettings.color;
    const emissiveColor = materialSettings.emissiveColor || '#000000';
    const emissiveIntensity = (materialSettings.emissiveIntensity ?? 0) / 100;
    
    const rawScale = materialSettings.scale !== undefined ? Number(materialSettings.scale) : 50;
    const safeScale = Math.max(1, Math.min(1000, isNaN(rawScale) ? 100 : rawScale));
    const texScaleX = 100 / safeScale;
    const texScaleY = 100 / safeScale;
    const texRotation = (materialSettings.rotation ?? 0) * (Math.PI / 180);
    const texOffsetX = (materialSettings.offset?.x ?? 0) / 100;
    const texOffsetY = (materialSettings.offset?.y ?? 0) / 100;

    const galleryTexture = materialSettings.appliedTexture;
    const isGalleryTexture = !!galleryTexture;

    const targetedMeshes = resolveTargetMeshes(selMat);
    const targetMeshSet = new Set(targetedMeshes);

    scene.traverse((child) => {
        if (child.isMesh && child.material) {
            const isLightingProp = changedProp === 'specular' || changedProp === 'reflection';
            let isTargetChild = false;
            if (isLightingProp) {
                isTargetChild = true;
            } else if (selMat && !isFullModel) {
                isTargetChild = targetMeshSet.has(child);
            } else if (isFullModel) {
                isTargetChild = !!materialSettings.useFactorColor;
            }

            if (!isTargetChild) return;

            // Isolate materials from unselected meshes so only selected meshes are modified!
            if (!isFullModel && !isLightingProp) {
                ensureMeshUniqueMaterial(child, targetMeshSet);
            }

            if (Array.isArray(child.material)) {
                child.material = child.material.map(ensurePhysicalMaterial);
            } else {
                child.material = ensurePhysicalMaterial(child.material);
            }
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            materials.forEach(m => {
                let isMatch = true;

                if (isMatch) {
                    // Apply ONLY the specific property that the user changed, or all on preset/reset/undo
                    const applyAll = isResetOrUndo || !changedProp;
                    
                    // 1. Color / Color Intensity: Apply when user changes color, or all on preset/reset/undo
                    const isColorProp = changedProp === 'color' || changedProp === 'colorIntensity';
                    const applyColor = applyAll || isColorProp;
                    if (applyColor && color && m.color && typeof m.color.set === 'function') {
                        const intensity = (materialSettings.colorIntensity ?? 100) / 100;
                        const finalColor = new THREE.Color(color);
                        finalColor.multiplyScalar(intensity);
                        m.color.copy(finalColor);
                    }

                    // 2. Metallic, Roughness, Reflection, AO, Specular
                    if (m.isMeshStandardMaterial || m.isMeshPhysicalMaterial) {
                        if (applyAll || changedProp === 'metallic') {
                            m.metalness = metallic;
                        }
                        if (applyAll || changedProp === 'roughness') {
                            m.roughness = roughness;
                        }
                        
                        // Reflection, Specular & AO
                        if (applyAll || isLightingProp || changedProp === 'reflection' || changedProp === 'specular') {
                            const reflVal = materialSettings.reflection !== undefined ? materialSettings.reflection : 50;
                            const specVal = materialSettings.specular !== undefined ? materialSettings.specular : 50;

                            // Reflection: maps 0-100% to envMapIntensity
                            // 0% -> 0.0 (completely disabled HDRI reflection)
                            // 50% -> 1.0 (standard physical reflection)
                            // 100% -> 3.5 (rich, vivid HDRI reflection)
                            const envMapIntensity = reflVal <= 50 
                                ? (reflVal / 50) 
                                : 1.0 + ((reflVal - 50) / 50) * 2.5;
                            m.envMapIntensity = envMapIntensity;

                            // Also adjust clearcoat and reflectivity dynamically with Reflection slider
                            // so that HDRI reflection is clearly and beautifully visible on any material surface
                            if (reflVal > 50) {
                                const boost = (reflVal - 50) / 50; // 0 to 1.0
                                m.clearcoat = Math.max(m.userData?.originalClearcoat || 0, boost * 0.9);
                                m.clearcoatRoughness = 0.05 + (1.0 - boost) * 0.15;
                                m.reflectivity = 0.5 + boost * 0.5;
                            } else {
                                m.clearcoat = ((m.userData?.originalClearcoat || 0) * (reflVal / 50));
                                m.reflectivity = (reflVal / 50) * 0.5;
                            }

                            // Specular slider controls direct specular shine (glare from sun/lights).
                            // In Three.js MeshPhysicalMaterial, specularIntensity also scales indirect specular (IBL reflection).
                            // If specularIntensity is 0, Three.js zeroes out HDRI reflection.
                            // To ensure reflection works even when specular is 0, we maintain an indirect reflection floor:
                            const baseSpec = (m.userData?.originalSpecularIntensity !== undefined) ? m.userData.originalSpecularIntensity : 1.0;
                            const specMultiplier = specVal <= 50 
                                ? (specVal / 50) 
                                : 1.0 + ((specVal - 50) / 50) * 2.0;

                            // Ensure specularIntensity allows HDRI reflection to show based on reflection slider
                            const reflectionFloor = reflVal > 0 ? Math.max(0.6, (reflVal / 50)) : 0;
                            m.specularIntensity = Math.max(reflectionFloor, specMultiplier) * baseSpec;

                            if (!m.specularColor) {
                                m.specularColor = new THREE.Color(1, 1, 1);
                            } else {
                                m.specularColor.setRGB(1, 1, 1);
                            }
                            m.ior = 1.5;
                            m.needsUpdate = true;
                        }
                        if ((applyAll || changedProp === 'ao') && m.aoMap) {
                            const aoIntensity = (materialSettings.ao ?? 100) / 100;
                            m.aoMapIntensity = aoIntensity;
                        }

                        if (applyAll) {
                            if (m.userData.originalClearcoat !== undefined) {
                                m.clearcoat = m.userData.originalClearcoat;
                            }
                        }
                    }

                    // 3. Opacity & Transparency
                    const isCutoutMatActive = /fringe|tassel|cutout|thread|strand|leaf|foliage|hair|fur|trans|alpha/i.test(`${child.name || ''}_${m.name || ''}`);
                    if (changedProp === 'alpha') {
                        const isTransparent = alpha < 0.999 || !!m.alphaMap;
                        m.transparent = isTransparent;
                        m.opacity = alpha;
                        m.depthWrite = true; // Always write depth so objects do not glitch through each other
                        m.alphaTest = (m.userData.originalAlphaTest !== undefined && m.userData.originalAlphaTest > 0)
                            ? m.userData.originalAlphaTest 
                            : (m.alphaMap || isCutoutMatActive ? 0.5 : 0);
                        if (m.alphaTest > 0 && alpha >= 0.999 && !m.alphaMap) {
                            m.transparent = false;
                        }
                    } else if (applyAll) {
                        // On preset/undo/reset, restore original alpha parameters rather than forcing alphaTest = 0!
                        if (m.userData.originalAlphaTest !== undefined && m.userData.originalAlphaTest > 0) {
                            m.alphaTest = m.userData.originalAlphaTest;
                        } else if (m.alphaMap || isCutoutMatActive) {
                            m.alphaTest = 0.5;
                        } else if (m.userData.originalAlphaTest !== undefined) {
                            m.alphaTest = m.userData.originalAlphaTest;
                        }
                        if (m.userData.originalTransparent !== undefined) {
                            m.transparent = m.userData.originalTransparent;
                        } else {
                            m.transparent = (m.opacity < 0.999) || Boolean(m.alphaMap);
                        }
                        m.depthWrite = true;
                        if (m.userData.originalOpacity !== undefined) {
                            m.opacity = m.userData.originalOpacity;
                        }
                    }

                    // 4. Emissive
                    if (applyAll || changedProp === 'emissiveColor' || changedProp === 'emissiveIntensity') {
                        if (m.emissive && typeof m.emissive.set === 'function') {
                            m.emissive.set(emissiveColor);
                            m.emissiveIntensity = emissiveIntensity;
                        }
                    }

                    // 5. Normal Scale
                    if ((applyAll || changedProp === 'normal') && m.normalMap && m.normalScale) {
                        m.normalScale.set(normalScaleVal, normalScaleVal);
                    }

                    // 6. Displacement & Bump Scale
                    if (applyAll || changedProp === 'bump') {
                        if (m.displacementMap) {
                            m.displacementScale = bumpScaleVal;
                        }
                        if (m.bumpMap) {
                            m.bumpScale = bumpScaleVal * 10;
                        }
                    }

                    // 7. Texture Removal Check
                    const configTextureId = materialSettings.appliedTexture?.id || materialSettings.appliedTexture?._id || null;
                    const matTextureId = m.userData.appliedTextureId || null;
                    const isNone = configTextureId === 'none';

                    if (matTextureId && (isNone || (isResetOrUndo && !configTextureId && materialSettings.useFactorColor))) {
                         // Texture was stripped from state (e.g. Undo) or 'None' selected, so strip from material
                         m.map = null;
                         m.normalMap = null;
                         m.roughnessMap = null;
                         m.metalnessMap = null;
                         m.aoMap = null;
                         m.displacementMap = null;
                         m.bumpMap = null;
                         m.alphaMap = null;
                         
                         // Restore original maps if they existed
                         if (m.userData.originalMap) m.map = m.userData.originalMap;
                         if (m.userData.originalNormalMap) m.normalMap = m.userData.originalNormalMap;
                         if (m.userData.originalAlphaMap) m.alphaMap = m.userData.originalAlphaMap;
                         
                         m.userData.appliedTexture = null;
                         m.userData.appliedTextureId = null;
                         m.needsUpdate = true;
                    }

                    // 8. Texture Transformations
                    const shouldTransformTextures = changedProp === 'scale' || changedProp === 'rotation' || changedProp === 'offset' || changedProp === 'appliedTexture' || (isResetOrUndo && (m.userData.__textureScale !== undefined || m.userData.appliedTextureId || materialSettings.lastChangedProp === 'scale'));
                    if (shouldTransformTextures) {
                        // Transform only surface patterns, NEVER aoMap or lightMap (baked geometry ambient occlusion)
                        const surfaceTextures = [m.map, m.normalMap, m.roughnessMap, m.metalnessMap, m.displacementMap, m.bumpMap, m.alphaMap, m.emissiveMap];
                        surfaceTextures.forEach(tex => {
                            if (tex) {
                                // IMPORTANT: Do not transform textures that are shared with baked aoMap or lightMap
                                if (tex === m.aoMap || tex === m.lightMap) return;

                                // GLTF textures default to ClampToEdgeWrapping which samples black borders when offset/rotated/scaled.
                                // RepeatWrapping allows texture patterns to repeat and slide seamlessly without turning black.
                                if (tex.wrapS !== THREE.RepeatWrapping || tex.wrapT !== THREE.RepeatWrapping) {
                                    tex.wrapS = THREE.RepeatWrapping;
                                    tex.wrapT = THREE.RepeatWrapping;
                                    if (tex.image) {
                                        tex.needsUpdate = true;
                                    }
                                }
                                // Safety: if texture was marked for update but has no image, clear it to prevent Three.js warning loop
                                if (!tex.image && tex.needsUpdate) {
                                    tex.needsUpdate = false;
                                }

                                if (tex.repeat && typeof tex.repeat.set === 'function') tex.repeat.set(texScaleX, texScaleY);
                                if (tex.offset && typeof tex.offset.set === 'function') tex.offset.set(texOffsetX, texOffsetY);
                                if (tex.rotation !== undefined) tex.rotation = texRotation;
                                if (tex.center && typeof tex.center.set === 'function') {
                                    if (texRotation !== 0) {
                                        tex.center.set(0.5, 0.5);
                                    } else {
                                        tex.center.set(0, 0);
                                    }
                                }
                                tex.matrixAutoUpdate = true;
                                if (typeof tex.updateMatrix === 'function') tex.updateMatrix();
                            }
                        });
                        m.userData.__textureScale = safeScale;
                    }

                    // Restore original or applied map if it exists, and user hasn't explicitly deleted it
                    if (m.userData.appliedMap?.isTexture && !m.map && !m.userData.is_map_removed) {
                        m.map = m.userData.appliedMap;
                        m.needsUpdate = true;
                    } else if (!m.userData.appliedTextureId && !m.map && m.userData.originalMap?.isTexture && !m.userData.is_map_removed) {
                        m.map = m.userData.originalMap;
                        m.needsUpdate = true;
                    }
                    if (!m.userData.appliedTextureId && !m.alphaMap && m.userData.originalAlphaMap?.isTexture && !m.userData.is_alphaMap_removed) {
                        m.alphaMap = m.userData.originalAlphaMap;
                        m.needsUpdate = true;
                    }
                    
                    if (!m.userData.originalColor && !materialSettings.useFactorColor) {
                        m.userData.originalColor = m.color.clone();
                    }

                    // Only trigger material recompile if structural properties changed (not high-frequency texture placement)
                    if (applyAll || changedProp === 'color' || changedProp === 'alpha' || changedProp === 'normal' || changedProp === 'bump') {
                        m.needsUpdate = true;
                    }
                }
            });
        }
    });
  }, [scene, materialSettings, modelName, selectedMaterial, resetKey, syncedSelectionSignature]);

  // C. Sync Map URLs from State (Independent from high-frequency slider interaction)
  useEffect(() => {
    if (!scene || !materialSettings?.maps || xrayMode) return;

    const isResetOrUndo = resetKey !== lastMapResetKeyRef.current;
    lastMapResetKeyRef.current = resetKey;
    
    // CRITICAL: Passive selection changes or slider adjustments (scale, rotation, offset, color, roughness, etc.)
    // must NEVER run this effect! Only run when maps/textures are explicitly uploaded or changed or on reset/undo.
    const changedProp = materialSettings.lastChangedProp;
    const isTextureChange = changedProp === 'maps' || changedProp === 'appliedTexture';
    if (!isTextureChange && (!isResetOrUndo || !materialSettings.useFactorColor)) {
        return;
    }

    const selMat = selectedMaterial;
    const targetMatName = selMat ? selMat.name : (modelName || "Scene");
    const isFullModel = !selMat || targetMatName === modelName || targetMatName === "Scene";

    const currentSig = `${modelName || ''}_${selMat ? (selMat.uuid || selMat.name) : 'FULL'}`;
    if (!isResetOrUndo && syncedSelectionSignature && syncedSelectionSignature !== currentSig) {
        return;
    }

    const stateMaps = materialSettings.maps;
    const isNone = materialSettings.appliedTexture?.id === 'none';

    if (isNone) return;

    const rawScaleC = materialSettings.scale !== undefined ? Number(materialSettings.scale) : 50;
    const safeScaleC = Math.max(1, Math.min(1000, isNaN(rawScaleC) ? 100 : rawScaleC));
    const texScaleX = 100 / safeScaleC;
    const texScaleY = 100 / safeScaleC;

    const targetedMeshes = resolveTargetMeshes(selectedMaterial);
    const targetMeshSet = new Set(targetedMeshes);

    const applyToMeshes = (meshes) => {
        meshes.forEach(child => {
            if (child.isMesh && child.material) {
                if (!isFullModel) {
                    ensureMeshUniqueMaterial(child, targetMeshSet);
                }
                const materials = Array.isArray(child.material) ? child.material : [child.material];
                materials.forEach(m => {
                    let isMatch = isFullModel ? (materialSettings.useFactorColor || isResetOrUndo) : targetMeshSet.has(child);

                    if (isMatch) {
                        const syncMap = (mapProp, stateUrl, isColor = false) => {
                            if (stateUrl && stateUrl !== "existing" && typeof stateUrl === 'string' && (!m[mapProp] || m[mapProp].userData?.url !== stateUrl)) {
                                // Performance: Use global cache for instant texture application
                                const cacheKey = `${stateUrl}_${isColor}`;
                                if (globalTextureCache.has(cacheKey)) {
                                    const cachedTex = globalTextureCache.get(cacheKey);
                                    m[mapProp] = cachedTex;
                                    if (m[mapProp]?.repeat && typeof m[mapProp].repeat.set === 'function') m[mapProp].repeat.set(texScaleX, texScaleY);
                                    m.userData[`is_${mapProp}_removed`] = false;
                                    m.needsUpdate = true;
                                    return;
                                }

                                sharedTextureLoader.load(stateUrl, (tex) => {
                                    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
                                    tex.flipY = false;
                                    tex.colorSpace = isColor ? THREE.SRGBColorSpace : THREE.NoColorSpace;
                                    tex.userData.url = stateUrl;
                                    if (tex?.repeat && typeof tex.repeat.set === 'function') tex.repeat.set(texScaleX, texScaleY);
                                    globalTextureCache.set(cacheKey, tex);
                                    m[mapProp] = tex;
                                    m.userData[`is_${mapProp}_removed`] = false;
                                    m.needsUpdate = true;
                                });
                            } else if (stateUrl === null || stateUrl === 'none' || (isResetOrUndo && !stateUrl && m.userData.appliedTextureId)) {
                                if (m[mapProp]) {
                                    m[mapProp] = null;
                                    // Restore original native maps if this mesh had them
                                    if (mapProp === 'map' && m.userData.originalMap) m.map = m.userData.originalMap;
                                    if (mapProp === 'normalMap' && m.userData.originalNormalMap) m.normalMap = m.userData.originalNormalMap;
                                    if (mapProp === 'roughnessMap' && m.userData.originalRoughnessMap) m.roughnessMap = m.userData.originalRoughnessMap;
                                    if (mapProp === 'metalnessMap' && m.userData.originalMetalnessMap) m.metalnessMap = m.userData.originalMetalnessMap;
                                    if (mapProp === 'aoMap' && m.userData.originalAoMap) m.aoMap = m.userData.originalAoMap;
                                    if (m.userData.appliedTextureId) {
                                        m.userData[`is_${mapProp}_removed`] = true;
                                    }
                                    m.needsUpdate = true;
                                }
                            }
                        };

                        syncMap('map', stateMaps.map, true);
                        syncMap('normalMap', stateMaps.normalMap);
                        syncMap('roughnessMap', stateMaps.roughnessMap);
                        syncMap('metalnessMap', stateMaps.metalnessMap);
                        syncMap('aoMap', stateMaps.aoMap);
                        syncMap('displacementMap', stateMaps.displacementMap);
                        syncMap('bumpMap', stateMaps.bumpMap);
                        syncMap('alphaMap', stateMaps.alphaMap);
                        syncMap('emissiveMap', stateMaps.emissiveMap, true);
                    }
                });
            }
        });
    };

    if (isFullModel) {
        if (!materialSettings.useFactorColor && !isResetOrUndo) return;
        meshIndexRef.current.forEach(applyToMeshes);
    } else {
        const targetMeshes = resolveTargetMeshes(selectedMaterial);
        applyToMeshes(targetMeshes);
    }
  }, [scene, materialSettings?.maps, materialSettings?.appliedTexture, selectedMaterial, modelName, resetKey, resolveTargetMeshes]);

  // C. Handle overall visibility & deletion
  useEffect(() => {
    if (!scene) return;
    
    scene.traverse((child) => {
        if (child.isMesh && child.material) {
            const childMatNames = Array.isArray(child.material) 
                ? child.material.map(m => m?.name).filter(Boolean)
                : [child.material?.name].filter(Boolean);

            const isDeleted = deletedMaterials && (
                (child.uuid && deletedMaterials.has(child.uuid)) || 
                childMatNames.some(mName => deletedMaterials.has(mName))
            );

            if (isDeleted) {
                child.visible = false;
                child.raycast = () => {};
                return;
            }

            // Restore raycast when visible / not deleted
            delete child.raycast;

            let isHidden = false;
            if (hiddenMaterials) {
                isHidden = (child.uuid && hiddenMaterials.has(child.uuid)) || 
                           (child.name && hiddenMaterials.has(child.name)) || 
                           childMatNames.some(mName => hiddenMaterials.has(mName));
            }
            child.visible = !isHidden;
        }
    });
  }, [scene, hiddenMaterials, deletedMaterials]);

  const prevTransformTargetRef = React.useRef(null);
  const lastTransformResetKeyRef = React.useRef(resetKey);

  // 3.5 Capture Initial Transforms (runs once per scene load)
  useEffect(() => {
    if (!scene) return;
    
    const capture = (obj) => {
        if (!obj.userData.originalTransform) {
            obj.userData.originalTransform = {
                position: obj.position.clone(),
                rotation: obj.rotation.clone(),
                scale: obj.scale.clone()
            };
        }
    };

    capture(scene);
    scene.traverse(capture);
  }, [scene]);

  // 3.6. Sync individual meshTransforms (from Undo / Redo or History Restore)
  useEffect(() => {
    if (!scene) return;
    if (isGizmoDraggingRef.current) return;

    scene.traverse(obj => {
      if (!obj.isMesh && !obj.isSkinnedMesh) return;
      const saved = meshTransforms ? (meshTransforms[obj.uuid] || (obj.name ? meshTransforms[obj.name] : null)) : null;
      if (saved) {
        if (saved.position) obj.position.set(saved.position.x, saved.position.y, saved.position.z);
        if (saved.rotation) obj.rotation.set(saved.rotation.x, saved.rotation.y, saved.rotation.z);
        if (saved.scale) obj.scale.set(saved.scale.x, saved.scale.y, saved.scale.z);
        obj.updateMatrix();
        obj.updateMatrixWorld(true);
      } else if (obj.userData?.originalTransform) {
        const orig = obj.userData.originalTransform;
        obj.position.copy(orig.position);
        obj.rotation.copy(orig.rotation);
        obj.scale.copy(orig.scale);
        obj.updateMatrix();
        obj.updateMatrixWorld(true);
      } else if (obj.userData?.__bindPos) {
        obj.position.set(obj.userData.__bindPos[0], obj.userData.__bindPos[1], obj.userData.__bindPos[2]);
        if (obj.userData.__bindQuat) obj.quaternion.set(obj.userData.__bindQuat[0], obj.userData.__bindQuat[1], obj.userData.__bindQuat[2], obj.userData.__bindQuat[3]);
        if (obj.userData.__bindScale) obj.scale.set(obj.userData.__bindScale[0], obj.userData.__bindScale[1], obj.userData.__bindScale[2]);
        obj.updateMatrix();
        obj.updateMatrixWorld(true);
      }
    });

    scene.updateMatrixWorld(true);

    if (transformTarget && transformTarget !== modelGroup) {
      updatePivotToTarget(transformTarget, relatedMeshesRef.current);
      if (typeof onTransformChange === 'function') {
        onTransformChange({
          position: transformTarget.position,
          rotation: transformTarget.rotation,
          scale: transformTarget.scale,
          meshUuid: transformTarget.uuid,
          meshName: transformTarget.name || selectedMaterial?.name
        });
      }
    }
  }, [meshTransforms, resetKey, scene, transformTarget, modelGroup, updatePivotToTarget, onTransformChange, selectedMaterial]);

  // 4. Determine Transform Target & Pivot (Runs whenever selection, transformMode, or scene changes)
  useEffect(() => {
    if (!scene) return;

    const targetName = selectedMaterial ? selectedMaterial.name : null;
    const isAll = selectedMaterial ? selectedMaterial.isAll : false;
    const isGroup = selectedMaterial ? selectedMaterial.isGroup : false;
    
    if (!selectedMaterial || !targetName || targetName === "Scene") {
        setTransformTarget(null);
        relatedMeshesRef.current = [];
        followerOffsetsRef.current.clear();
        return;
    }

    // Default to Full Model (modelGroup) ONLY if pure model name clicked in list without isAll and not a multi-selection
    if (targetName === modelName && !isAll && !isGroup) {
        relatedMeshesRef.current = [];
        followerOffsetsRef.current.clear();

        if (modelGroup) {
            setTransformTarget(modelGroup);
            if (typeof onTransformChange === 'function') {
                const norm = scene.userData?.normalization;
                const bx = norm?.position?.[0] ?? 0;
                const by = norm?.position?.[1] ?? 0;
                const bz = norm?.position?.[2] ?? 0;
                const bScale = norm?.scale ?? 1;
                onTransformChange({
                    position: {
                        x: modelGroup.position.x - bx,
                        y: modelGroup.position.y - by,
                        z: modelGroup.position.z - bz
                    },
                    rotation: {
                        x: modelGroup.rotation.x,
                        y: modelGroup.rotation.y,
                        z: modelGroup.rotation.z
                    },
                    scale: {
                        x: bScale ? modelGroup.scale.x / bScale : 1,
                        y: bScale ? modelGroup.scale.y / bScale : 1,
                        z: bScale ? modelGroup.scale.z / bScale : 1
                    }
                });
            }
        }
        return;
    }

    // Priority: Resolve all meshes targeted by the current selection (Group, All Meshes, Multi-selection, or Single Mesh)
    const targetedMeshes = resolveTargetMeshes(selectedMaterial);

    if (targetedMeshes && targetedMeshes.length > 0) {
        const leader = targetedMeshes[0];
        setTransformTarget(leader);
        relatedMeshesRef.current = targetedMeshes;
        updatePivotToTarget(leader, targetedMeshes);

        if (targetedMeshes.length > 1) {
            leader.updateMatrixWorld(true);
            const leaderWorldInverse = new THREE.Matrix4().copy(leader.matrixWorld).invert();
            
            const offsets = new Map();
            targetedMeshes.forEach(mesh => {
                if (mesh === leader) return;
                mesh.updateMatrixWorld(true);
                const relativeMatrix = new THREE.Matrix4().multiplyMatrices(leaderWorldInverse, mesh.matrixWorld);
                offsets.set(mesh.uuid, relativeMatrix);
            });
            followerOffsetsRef.current = offsets;
        } else {
            followerOffsetsRef.current.clear();
        }

        if (typeof onTransformChange === 'function') {
            const pivot = pivotRef.current;
            onTransformChange({
                position: pivot ? pivot.position : leader.position,
                rotation: pivot ? pivot.rotation : leader.rotation,
                scale: pivot ? pivot.scale : leader.scale,
                meshUuid: leader.uuid,
                meshName: selectedMaterial?.name || leader.name
            });
        }
        return;
    }

    setTransformTarget(null);
    relatedMeshesRef.current = [];
    followerOffsetsRef.current.clear();
  }, [scene, selectedMaterial, transformMode, modelName, onTransformChange, modelGroup, updatePivotToTarget, resolveTargetMeshes]);

  // 4.5. Sync transformValues (from UI / Undo) → the currently ACTIVE transform target only.
  useEffect(() => {
      const isResetOrUndo = resetKey !== lastTransformResetKeyRef.current;
      lastTransformResetKeyRef.current = resetKey;

      if (!transformTarget) {
          prevTransformTargetRef.current = null;
          return;
      }

      if (!transformValues || !transformValues.position || !transformValues.rotation || !transformValues.scale) return;

      // Strict target validation: Ensure transformTarget matches selectedMaterial
      const targetName = selectedMaterial ? selectedMaterial.name : (modelName || "Scene");
      const isTargetValid = (() => {
          if (!selectedMaterial || targetName === modelName || targetName === "Scene") {
              return transformTarget === modelGroup || transformTarget === scene;
          }
          if (selectedMaterial.uuid && transformTarget.uuid === selectedMaterial.uuid) {
              return true;
          }
          if (selectedMaterial.isGroup && Array.isArray(selectedMaterial.materials)) {
              const m = transformTarget.material;
              const mats = Array.isArray(m) ? m : [m];
              return mats.some(mat => selectedMaterial.materials.includes(mat?.name));
          }
          const m = transformTarget.material;
          const mats = Array.isArray(m) ? m : [m];
          return mats.some(mat => mat?.name === targetName);
      })();

      if (!isTargetValid) {
          // Guard: If transformTarget has not yet updated to match selectedMaterial, skip applying to avoid corrupting wrong mesh
          return;
      }

      if (!isResetOrUndo && prevTransformTargetRef.current !== transformTarget) {
          prevTransformTargetRef.current = transformTarget;
          return;
      }
      prevTransformTargetRef.current = transformTarget;

      // Skip overwriting during active gizmo drag
      if (!isResetOrUndo && isGizmoDraggingRef.current) {
          return;
      }

      if (transformTarget === modelGroup) {
          const norm = scene.userData?.normalization;
          if (norm) {
              const [bx, by, bz] = norm.position || [0, 0, 0];
              const bScale = norm.scale || 1;
              transformTarget.position.set(
                  bx + (transformValues.position.x || 0),
                  by + (transformValues.position.y || 0),
                  bz + (transformValues.position.z || 0)
              );
              transformTarget.rotation.set(
                  transformValues.rotation.x || 0,
                  transformValues.rotation.y || 0,
                  transformValues.rotation.z || 0
              );
              transformTarget.scale.set(
                  bScale * (transformValues.scale.x || 1),
                  bScale * (transformValues.scale.y || 1),
                  bScale * (transformValues.scale.z || 1)
              );
              transformTarget.updateMatrixWorld?.(true);
              return;
          }
      }

      if (transformTarget !== modelGroup) {
          // Child mesh transforms are exclusively managed by Effect 3.6 (meshTransforms)
          // to prevent glitching, jumping, and position clobbering during undo/redo/sync
          return;
      }

  }, [transformTarget,
      transformValues?.position?.x, transformValues?.position?.y, transformValues?.position?.z,
      transformValues?.rotation?.x, transformValues?.rotation?.y, transformValues?.rotation?.z,
      transformValues?.scale?.x, transformValues?.scale?.y, transformValues?.scale?.z,
      selectedMaterial, modelName, resetKey, modelGroup, scene, updatePivotToTarget]);

  // 5. Scene-Wide Reset Effect
  useEffect(() => {
    if (sceneResetTrigger > 0 && scene) {
        // Reset the root scene object
        if (scene.userData.normalization) {
            const norm = scene.userData.normalization;
            scene.position.set(0, 0, 0);
            scene.rotation.set(0, 0, 0);
            scene.scale.set(1, 1, 1);
            scene.updateMatrixWorld(true);
            setPosition(norm.position);
            setScale(norm.scale);
        } else if (scene.userData.originalTransform) {
            const orig = scene.userData.originalTransform;
            scene.position.copy(orig.position);
            scene.rotation.copy(orig.rotation);
            scene.scale.copy(orig.scale);
            scene.updateMatrix();
        }

        // Reset all individual objects that have been moved
        meshIndexRef.current.forEach(meshes => {
            meshes.forEach(child => {
                 if (child.userData && child.userData.originalTransform) {
                     const original = child.userData.originalTransform;
                     child.position.copy(original.position);
                     child.rotation.copy(original.rotation);
                     child.scale.copy(original.scale);
                     child.updateMatrix();
                     child.updateMatrixWorld(true);
                 }
            });
        });

        // Reset the main model group wrapper if it was moved
        if (modelGroup) {
             const norm = scene.userData?.normalization;
             if (norm) {
                 const [bx, by, bz] = norm.position || [0, 0, 0];
                 const bScale = norm.scale || 1;
                 modelGroup.position.set(bx, by, bz);
                 modelGroup.rotation.set(0, 0, 0);
                 modelGroup.scale.set(bScale, bScale, bScale);
             } else if (modelGroup.userData.originalTransform) {
                 const original = modelGroup.userData.originalTransform;
                 modelGroup.position.copy(original.position);
                 modelGroup.rotation.copy(original.rotation);
                 modelGroup.scale.copy(original.scale);
             } else {
                 modelGroup.position.set(0,0,0);
                 modelGroup.rotation.set(0,0,0);
                 modelGroup.scale.set(1,1,1);
             }
             modelGroup.updateMatrix();
             modelGroup.updateMatrixWorld(true);
        }
    }
  }, [sceneResetTrigger, scene, modelGroup]);

  // 6. UV Unwrap Logic (Auto Default)
  const applyBoxUV = (mesh) => {
      if (!mesh.geometry) return;
      
      const geometry = mesh.geometry;
      geometry.computeBoundingBox();
      
      const { min, max } = geometry.boundingBox;
      const range = new THREE.Vector3().subVectors(max, min);
      if(range.x === 0) range.x = 1;
      if(range.y === 0) range.y = 1;
      if(range.z === 0) range.z = 1;

      const posAttribute = geometry.attributes.position;
      if (!geometry.attributes.normal) geometry.computeVertexNormals();
      const normalAttribute = geometry.attributes.normal;

      const uvAttribute = geometry.attributes.uv || new THREE.BufferAttribute(new Float32Array(posAttribute.count * 2), 2);
      
      for (let i = 0; i < posAttribute.count; i++) {
          const x = posAttribute.getX(i);
          const y = posAttribute.getY(i);
          const z = posAttribute.getZ(i);
          
          const nx = Math.abs(normalAttribute.getX(i));
          const ny = Math.abs(normalAttribute.getY(i));
          const nz = Math.abs(normalAttribute.getZ(i));
          
          let u = 0, v = 0;

          if (nx >= ny && nx >= nz) {
              u = (z - min.z) / range.z;
              v = (y - min.y) / range.y;
          } else if (ny >= nx && ny >= nz) {
              u = (x - min.x) / range.x;
              v = (z - min.z) / range.z;
          } else {
              u = (x - min.x) / range.x;
              v = (y - min.y) / range.y;
          }
          
          uvAttribute.setXY(i, u, v);
      }
      
      geometry.setAttribute('uv', uvAttribute);
      geometry.attributes.uv.needsUpdate = true;
      
      // Re-compute tangents safely if normal mapping is expected
      safeComputeTangents(geometry);
  };

  useEffect(() => {
    if (scene && uvUnwrapTrigger > 0) {
        const targetMatName = selectedMaterial ? selectedMaterial.name : null;
        const isFullModel = !targetMatName || (modelName && targetMatName === modelName);
        const isGroup = selectedMaterial?.isGroup;
        const groupMats = selectedMaterial?.materials || [];


        let modifiedAny = false;
        
        const applyToSelection = (meshes) => {
            meshes.forEach(child => {
                if (child.isMesh && child.material) {
                    applyBoxUV(child);
                    modifiedAny = true;
                }
            });
        };

        if (isFullModel) {
            meshIndexRef.current.forEach(applyToSelection);
        } else {
            const targetMeshes = resolveTargetMeshes(selectedMaterial);
            applyToSelection(targetMeshes);
        }

        if (modifiedAny) {
            // Since UV unwrapping changes geometry attributes (permanent till reload), 
            // we treat it as a state change for the history.
            // We'll push a snapshot of current settings.
            if (onUpdateMaterialSettingRef.current) {
                // Trigger a dummy update to force a history push if needed, 
                // but since this is geometry, we just want a checkpoint.
                onUpdateMaterialSettingRef.current('uvUnwrap', Date.now(), false);
            }
        }
    }
  }, [uvUnwrapTrigger, scene, selectedMaterial, modelName, resolveTargetMeshes]);


  return (
    <>
         <primitive object={pivotRef.current} />
         {transformMode && transformTarget && (
              <TransformControls 
                 key={`gizmo_${transformMode}_${selectedMaterial?.isAll ? 'all' : (selectedMaterial?.name || 'sel')}_${relatedMeshesRef.current.length}_${transformTarget === modelGroup ? 'mg' : (transformTarget?.uuid || 'pv')}`}
                 object={transformTarget === modelGroup ? modelGroup : pivotRef.current} 
                 mode={transformMode} 
                 size={0.8} 
                 space="local" 
                 onPointerDown={(e) => {
                     e.stopPropagation();
                 }}
                 onMouseDown={(e) => {
                     isGizmoDraggingRef.current = true;
                     if (typeof onTransformStart === 'function') onTransformStart(e);
                 }}
                 onChange={() => {
                     if (transformTarget === modelGroup) {
                         const norm = scene.userData?.normalization;
                         const bx = norm?.position?.[0] ?? 0;
                         const by = norm?.position?.[1] ?? 0;
                         const bz = norm?.position?.[2] ?? 0;
                         const bScale = norm?.scale ?? 1;
                         if (typeof onTransformChange === 'function') {
                             onTransformChange({
                                 position: {
                                     x: transformTarget.position.x - bx,
                                     y: transformTarget.position.y - by,
                                     z: transformTarget.position.z - bz
                                 },
                                 rotation: {
                                     x: transformTarget.rotation.x,
                                     y: transformTarget.rotation.y,
                                     z: transformTarget.rotation.z
                                 },
                                 scale: {
                                     x: bScale ? transformTarget.scale.x / bScale : 1,
                                     y: bScale ? transformTarget.scale.y / bScale : 1,
                                     z: bScale ? transformTarget.scale.z / bScale : 1
                                 }
                             });
                         }
                     } else {
                         const pivot = pivotRef.current;
                         if (pivot) {
                             pivot.updateMatrixWorld(true);
                             const pivotWorldMatrix = pivot.matrixWorld;
                             const list = (relatedMeshesRef.current && relatedMeshesRef.current.length > 0)
                                 ? relatedMeshesRef.current
                                 : (transformTarget ? [transformTarget] : []);

                             list.forEach(mesh => {
                                 const relMatrix = pivotOffsetsRef.current.get(mesh.uuid);
                                 if (relMatrix && mesh.parent) {
                                     const newWorldMatrix = new THREE.Matrix4().multiplyMatrices(pivotWorldMatrix, relMatrix);
                                     const parentInverse = new THREE.Matrix4().copy(mesh.parent.matrixWorld).invert();
                                     const newLocalMatrix = new THREE.Matrix4().multiplyMatrices(parentInverse, newWorldMatrix);
                                     newLocalMatrix.decompose(mesh.position, mesh.quaternion, mesh.scale);
                                     mesh.updateMatrix();
                                     mesh.updateMatrixWorld(true);
                                 }
                             });
                         }

                         if (typeof onTransformChange === 'function' && transformTarget) {
                             const pivot = pivotRef.current;
                             onTransformChange({
                                 position: pivot ? pivot.position : transformTarget.position,
                                 rotation: pivot ? pivot.rotation : transformTarget.rotation,
                                 scale: pivot ? pivot.scale : transformTarget.scale,
                                 meshUuid: transformTarget.uuid,
                                 meshName: transformTarget.name || selectedMaterial?.name
                             });
                         }
                     }
                 }}
                 onMouseUp={(e) => {
                     isGizmoDraggingRef.current = false;
                     const all = {};
                     const list = (relatedMeshesRef.current && relatedMeshesRef.current.length > 0)
                         ? relatedMeshesRef.current
                         : (transformTarget ? [transformTarget] : []);
                     list.forEach(m => {
                         if (m && m.uuid) {
                             all[m.uuid] = {
                                 position: { x: m.position.x, y: m.position.y, z: m.position.z },
                                 rotation: { x: m.rotation.x, y: m.rotation.y, z: m.rotation.z },
                                 scale:    { x: m.scale.x,    y: m.scale.y,    z: m.scale.z },
                                 name: m.name || ''
                             };
                         }
                     });
                     if (typeof onTransformEnd === 'function') {
                         onTransformEnd(all);
                     }
                     if (transformTarget !== modelGroup) {
                         updatePivotToTarget(transformTarget, relatedMeshesRef.current);
                     }
                 }}
              />
         )}
        <group 
            ref={setModelGroup}
            scale={scale}
            position={position}
            onPointerDown={(e) => {
                e.stopPropagation();
                meshPointerDownPosRef.current = { x: e.clientX, y: e.clientY };
            }}
            onClick={(e) => {
                e.stopPropagation();

                // Movement check: if user dragged to rotate the camera, ignore selection
                if (meshPointerDownPosRef.current) {
                    const dx = Math.abs(e.clientX - meshPointerDownPosRef.current.x);
                    const dy = Math.abs(e.clientY - meshPointerDownPosRef.current.y);
                    if (dx > 6 || dy > 6) return;
                }

                const intersections = e.intersections;
                if (intersections && intersections.length > 0) {
                    // Selection Guard: Ignore selection if the user is clicking on active transformation handles
                    const closest = intersections[0].object;
                    let isGizmo = false;
                    let p = closest;
                    while (p) {
                        if (p.isTransformControls || p.name?.includes('Transform') || p.name?.includes('Gizmo')) {
                            isGizmo = true;
                            break;
                        }
                        p = p.parent;
                    }
                    if (isGizmo) return;
                }

                // Identify the specific mesh hit: find the first intersection that is a mesh inside this scene
                let mesh = e.object;
                if (intersections && intersections.length > 0) {
                    const currentSelectedUuid = selectedMaterial?.uuid || selectedMaterial?.meshUuid;
                    const candidateHits = [];
                    for (const hit of intersections) {
                        let curr = hit.object;
                        let isPartOfScene = false;
                        while (curr) {
                            if (curr === scene) {
                                isPartOfScene = true;
                                break;
                            }
                            curr = curr.parent;
                        }
                        if (isPartOfScene && (hit.object.isMesh || hit.object.isSkinnedMesh)) {
                            candidateHits.push(hit.object);
                        }
                    }

                    if (candidateHits.length > 0) {
                        // In X-ray mode, if clicking on an already selected translucent mesh,
                        // allow clicking through to inspect/select inner meshes behind it
                        if (xrayMode && candidateHits[0]?.uuid === currentSelectedUuid && candidateHits.length > 1) {
                            mesh = candidateHits[1];
                        } else {
                            mesh = candidateHits[0];
                        }
                    }
                }

                if (mesh && (mesh.isMesh || mesh.isSkinnedMesh)) {
                    let mat = mesh.userData?.__preXrayMaterial || mesh.material;
                    if (Array.isArray(mat)) {
                        if (e.face && e.face.materialIndex !== undefined) {
                            mat = mat[e.face.materialIndex];
                        } else {
                            mat = mat[0];
                        }
                    }
                    const matName = (mat && mat.name) ? mat.name : (mesh.name || "Material");
                    const meshName = mesh.name || matName;

                    // Extract fresh texture thumbnails at click time (bypasses stale load-time cache)
                    const freshMaps = {};
                    if (mat) {
                        const texSlots = [
                            'map', 'normalMap', 'roughnessMap', 'metalnessMap',
                            'emissiveMap', 'aoMap', 'bumpMap', 'displacementMap', 'alphaMap'
                        ];
                        for (const slot of texSlots) {
                            if (mat[slot]) {
                                const src = getTextureSource(mat[slot]);
                                if (src) freshMaps[slot] = src;
                            }
                        }
                    }

                    let worldNormal = null;
                    if (e.intersections?.[0]?.face?.normal && mesh) {
                        try {
                            const nMat = new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld);
                            const nVec = e.intersections[0].face.normal.clone().applyMatrix3(nMat).normalize();
                            worldNormal = { x: nVec.x, y: nVec.y, z: nVec.z };
                        } catch (_) {
                            worldNormal = {
                                x: e.intersections[0].face.normal.x,
                                y: e.intersections[0].face.normal.y,
                                z: e.intersections[0].face.normal.z
                            };
                        }
                    }

                    if (typeof onSelectMaterial === 'function') {
                        onSelectMaterial({ 
                            name: meshName, 
                            material: matName,
                            uuid: mesh.uuid, 
                            meshUuid: mesh.uuid,
                            meshName: mesh.name || meshName,
                            parentGroup: modelName,
                            isMesh: true,
                            isShift: e.shiftKey,
                            isTransformSelect: !!transformMode,
                            freshMaps,
                            clickPoint: e.point ? { x: e.point.x, y: e.point.y, z: e.point.z } : null,
                            clickNormal: worldNormal
                        });
                    }
                }
            }}
        >
            <primitive 
                object={scene} 
            />
        </group>

        {/* Clean silhouette outline for all selected mesh(es) */}
        {(() => {
          if (!selectedMaterial || selectedMaterial.name === 'Scene') return null;
          const target = resolveTargetMeshes(selectedMaterial);
          if (!target || (Array.isArray(target) && target.length === 0)) return null;
          const targetKey = Array.isArray(target) ? target.map(m => m.uuid).join('_') : (target.uuid || 'sel');
          return <MeshSelectionHighlight key={targetKey} target={target} />;
        })()}
    </>
  );
}));

export default GenericModel;
