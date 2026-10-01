import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { CustomQRCode } from './Model3DEditor';
import ColorPicker from './ColorPicker';
import Hotspot3DOverlay from '../ThreedEditor/Components/Hotspot3DOverlay';
import axios from 'axios';
import { resolveUploadsPath } from '../../utils/supabaseUtils';

const ModelScene = ({ 
  url, 
  autoRotate = true, 
  autoRotateSpeed = 1.5, 
  shadowStrength = 35, 
  shadowSoftness = 35, 
  lockMaxZoom = true, 
  maxZoom = 4.5, 
  hotspots = [], 
  activeHotspotId = null, 
  onHotspotClick 
}) => {
  const { scene, animations } = useGLTF(url);
  const { camera, controls } = useThree();
  const mixerRef = useRef(null);
  const sceneWrapperRef = useRef(null);
  const controlsRef = useRef(null);
  const cameraAnimRef = useRef(null);

  // Exact viewport normalization matching ThreedEditor (GenericModel)
  const normTransform = React.useMemo(() => {
    if (!scene) {
      return {
        scale: 1,
        position: [0, 0, 0],
        height: 2,
        radius: 1.5,
        modelCenter: new THREE.Vector3(0, 1, 0)
      };
    }

    // Ensure clean rest transforms on raw scene object before measuring
    scene.position.set(0, 0, 0);
    scene.scale.set(1, 1, 1);
    scene.rotation.set(0, 0, 0);
    scene.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(scene);
    if (box.isEmpty() || !isFinite(box.min.x)) {
      return {
        scale: 1,
        position: [0, 0, 0],
        height: 2,
        radius: 1.5,
        modelCenter: new THREE.Vector3(0, 1, 0)
      };
    }
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    const maxDim = Math.max(size.x, size.y, size.z);
    // Target size 3.5 units for clear, large, prominent framing in the viewport
    const TARGET_SIZE = 3.5;
    const targetScale = maxDim > 0 ? (TARGET_SIZE / maxDim) : 1;

    // Center on X and Z, and place the bottom at exactly Y = 0 on the base grid (no floating)
    const centeredX = -center.x * targetScale;
    const centeredZ = -center.z * targetScale;
    const bottomY = -box.min.y * targetScale;
    const height = size.y * targetScale;
    const radius = Math.max(0.8, (maxDim * targetScale) / 2);
    const modelCenter = new THREE.Vector3(0, height / 2, 0);

    return {
      scale: targetScale,
      position: [centeredX, bottomY, centeredZ],
      height,
      radius,
      modelCenter
    };
  }, [scene]);

  // Clean raw scene transforms
  useEffect(() => {
    if (scene) {
      scene.position.set(0, 0, 0);
      scene.scale.set(1, 1, 1);
      scene.rotation.set(0, 0, 0);
      scene.updateMatrixWorld(true);
    }
  }, [scene]);

  // Smooth front-facing camera focus on a hotspot
  const focusHotspot = React.useCallback((hs) => {
    if (!hs) return;
    const activeControls = controlsRef.current || controls;
    if (!activeControls) return;

    const posArr = Array.isArray(hs.position)
      ? hs.position
      : (hs.position && typeof hs.position === 'object')
      ? [hs.position.x || 0, hs.position.y || 0, hs.position.z || 0]
      : [0, 0, 0];

    const hsPos = new THREE.Vector3(
      Number(posArr[0]) || 0,
      Number(posArr[1]) || 0,
      Number(posArr[2]) || 0
    );

    const targetCenter = normTransform.modelCenter.clone();

    // Compute front view direction
    let frontDir = new THREE.Vector3();
    if (hs.normal && Array.isArray(hs.normal) && (Math.abs(hs.normal[0]) > 0.001 || Math.abs(hs.normal[1]) > 0.001 || Math.abs(hs.normal[2]) > 0.001)) {
      frontDir.set(Number(hs.normal[0]) || 0, Number(hs.normal[1]) || 0, Number(hs.normal[2]) || 0).normalize();
    } else {
      frontDir.subVectors(hsPos, targetCenter);
      if (frontDir.lengthSq() > 0.0001) {
        frontDir.normalize();
      } else {
        frontDir.set(0, 0.2, 1).normalize();
      }
    }

    if (frontDir.y > 0.82) {
      frontDir.set(frontDir.x * 0.4, 0.85, 0.45).normalize();
    } else if (frontDir.y < -0.82) {
      frontDir.set(frontDir.x * 0.4, -0.85, 0.45).normalize();
    } else {
      frontDir.y = Math.max(-0.4, Math.min(0.5, frontDir.y + 0.1));
      frontDir.normalize();
    }

    const framingDistance = Math.max(1.2, normTransform.radius * 1.4);
    const lookTarget = targetCenter.clone().lerp(hsPos, 0.45);
    const endCamPos = lookTarget.clone().add(frontDir.clone().multiplyScalar(framingDistance));

    const startCamPos = camera.position.clone();
    const startTarget = activeControls.target.clone();
    const startTime = performance.now();
    const duration = 500;

    if (cameraAnimRef.current) {
      cancelAnimationFrame(cameraAnimRef.current);
      cameraAnimRef.current = null;
    }

    const animateStep = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - progress, 3);

      camera.position.lerpVectors(startCamPos, endCamPos, ease);
      activeControls.target.lerpVectors(startTarget, lookTarget, ease);
      activeControls.update();

      if (progress < 1) {
        cameraAnimRef.current = requestAnimationFrame(animateStep);
      } else {
        cameraAnimRef.current = null;
      }
    };
    cameraAnimRef.current = requestAnimationFrame(animateStep);
  }, [camera, controls, normTransform]);

  const handleHotspotClick = (hs, index) => {
    if (typeof onHotspotClick === 'function') {
      onHotspotClick(hs, index);
    } else {
      focusHotspot(hs);
    }
  };

  useEffect(() => {
    if (!activeHotspotId || !hotspots || hotspots.length === 0) return;
    const targetHs = hotspots.find(h => String(h.id) === String(activeHotspotId));
    if (targetHs) {
      focusHotspot(targetHs);
    }
  }, [activeHotspotId, hotspots, focusHotspot]);

  useEffect(() => {
    return () => {
      if (cameraAnimRef.current) {
        cancelAnimationFrame(cameraAnimRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!scene) return;
    const animClips = (animations && animations.length > 0) ? animations : (scene.animations || []);
    if (!animClips || animClips.length === 0) {
      if (mixerRef.current) {
        try {
          mixerRef.current.stopAllAction();
          mixerRef.current.uncacheRoot(scene);
        } catch (_) {}
        mixerRef.current = null;
      }
      return;
    }

    scene.traverse((child) => {
      if (child.isMesh || child.isSkinnedMesh) {
        child.frustumCulled = false;
      }
    });

    const mixer = new THREE.AnimationMixer(scene);
    mixerRef.current = mixer;

    // Filter overlapping tracks so distinct full-body clips don't fight each other
    const targetedProperties = new Set();
    const clipsToPlay = [];

    for (const clip of animClips) {
      if (!clip || !Array.isArray(clip.tracks) || clip.tracks.length === 0) continue;
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

    clipsToPlay.forEach((clip) => {
      try {
        const action = mixer.clipAction(clip);
        action.reset();
        action.setLoop(THREE.LoopRepeat, Infinity);
        action.clampWhenFinished = false;
        action.enabled = true;
        action.setEffectiveTimeScale(1);
        action.setEffectiveWeight(1);
        action.play();
      } catch (e) {
        console.warn("[Interaction3DPreview] Error playing clip:", clip.name, e);
      }
    });

    return () => {
      try {
        mixer.stopAllAction();
        mixer.uncacheRoot(scene);
      } catch (e) {}
      mixerRef.current = null;
    };
  }, [scene, animations]);

  useFrame((state, delta) => {
    if (mixerRef.current) {
      const safeDelta = Math.min(delta, 0.1);
      mixerRef.current.update(safeDelta);
    }
  });

  // Set initial camera framing matching ThreedEditor hero view
  React.useEffect(() => {
    if (!scene) return;
    const { radius, modelCenter } = normTransform;

    const fov = camera.fov || 50;
    const vFOVRad = THREE.MathUtils.degToRad(fov) / 2;
    const dist = (radius / Math.sin(vFOVRad)) * 1.35;
    const distance = Math.max(2.8, Math.min(dist, 60));

    // 3/4 elevated isometric/hero perspective (polar ~66° = ~24° elevation, azimuth ~38°)
    const phi = THREE.MathUtils.degToRad(66);
    const theta = THREE.MathUtils.degToRad(38);

    const camX = modelCenter.x + distance * Math.sin(phi) * Math.sin(theta);
    const camY = modelCenter.y + distance * Math.cos(phi);
    const camZ = modelCenter.z + distance * Math.sin(phi) * Math.cos(theta);

    camera.near = Math.min(0.05, distance / 50);
    camera.far = Math.max(1000, distance * 25);
    camera.position.set(camX, camY, camZ);
    camera.lookAt(modelCenter);
    camera.updateProjectionMatrix();

    const activeControls = controlsRef.current || controls;
    if (activeControls) {
      activeControls.target.copy(modelCenter);
      activeControls.update();
    }
  }, [url, scene, camera, controls, normTransform]);

  const numShadowStrength = Number(shadowStrength) || 0;
  const numShadowSoftness = Number(shadowSoftness) || 0;
  const numAutoRotateSpeed = Number(autoRotateSpeed) || 1.5;
  const numMaxZoom = Number(maxZoom) || 4.5;

  const baseDist = React.useMemo(() => {
    const fovRad = ((camera.fov || 50) * Math.PI) / 360;
    return (normTransform.radius / Math.sin(fovRad)) * 1.35;
  }, [normTransform.radius, camera.fov]);

  const minZoomDist = lockMaxZoom ? Math.max(0.1, baseDist / Math.max(1, numMaxZoom)) : 0.1;
  const maxZoomDist = lockMaxZoom ? Math.max(baseDist, baseDist * Math.max(1, numMaxZoom)) : 500;

  return (
    <>
      <Environment preset="city" />
      <ambientLight intensity={0.7} />
      <directionalLight position={[10, 10, 10]} intensity={1} />
      <directionalLight position={[-10, -10, -10]} intensity={0.3} />

      {/* 3D Model with exact ThreedEditor normalization */}
      <group
        ref={sceneWrapperRef}
        scale={normTransform.scale}
        position={normTransform.position}
      >
        <primitive object={scene} />
      </group>

      {/* 3D Hotspots overlay at exact world coordinates */}
      {hotspots && hotspots.length > 0 && (
        <Hotspot3DOverlay
          hotspots={hotspots}
          activeHotspotId={activeHotspotId}
          onHotspotClick={handleHotspotClick}
          sceneWrapperRef={sceneWrapperRef}
        />
      )}

      {numShadowStrength > 0 && (
        <ContactShadows
          position={[0, -0.01, 0]}
          opacity={numShadowStrength / 100}
          blur={(numShadowSoftness / 100) * 3 + 0.2}
          far={normTransform.radius * 4}
          resolution={1024}
          scale={normTransform.radius * 6}
          color="#000000"
        />
      )}

      <OrbitControls 
        ref={controlsRef}
        makeDefault 
        enableZoom={true} 
        enablePan={true} 
        autoRotate={autoRotate && !activeHotspotId} 
        autoRotateSpeed={numAutoRotateSpeed} 
        minDistance={minZoomDist}
        maxDistance={maxZoomDist}
      />
    </>
  );
};

const GlbModelViewer = React.memo(({ 
  url, 
  autoRotate = true, 
  autoRotateSpeed = 1.5,
  shadowStrength = 35,
  shadowSoftness = 35,
  lockMaxZoom = true,
  maxZoom = 4.5,
  hotspots = [],
  activeHotspotId = null,
  onHotspotClick
}) => {
  const [timestamp, setTimestamp] = useState('');

  React.useEffect(() => {
    const bc = new BroadcastChannel('threed_model_updates');
    bc.onmessage = (e) => {
      if (e.data && e.data.type === 'model-saved') {
        setTimestamp(`?v=${e.data.timestamp}`);
      }
    };
    return () => bc.close();
  }, []);

  const finalUrl = React.useMemo(() => {
    return timestamp ? `${url}${timestamp}` : url;
  }, [url, timestamp]);

  return (
    <Canvas camera={{ fov: 50, position: [0, 0, 5] }} style={{ background: 'transparent', width: '100%', height: '100%' }}>
      <React.Suspense fallback={null}>
        <ModelScene 
          url={finalUrl}
          autoRotate={autoRotate}
          autoRotateSpeed={autoRotateSpeed}
          shadowStrength={shadowStrength}
          shadowSoftness={shadowSoftness}
          lockMaxZoom={lockMaxZoom}
          maxZoom={maxZoom}
          hotspots={hotspots}
          activeHotspotId={activeHotspotId}
          onHotspotClick={onHotspotClick}
        />
      </React.Suspense>
    </Canvas>
  );
});

const Model3DPreviewModal = ({ 
  isOpen, 
  dataUrl, 
  shadowStrength = 35,
  shadowSoftness = 35,
  autoRotate = true, 
  autoRotateSpeed = 1.5, 
  lockMaxZoom = true,
  maxZoom = 4.5,
  bgType = 'Solid', 
  bgColor: initialBgColor = '#ffffff',
  customBg = true,
  enableAR = true,
  setBgColor: externalSetBgColor,
  qrText = 'Scan Me', qrColor = '#000000', qrBgType = 'Solid', qrBgColor = '#ffffff', qrLevel = 'M', qrDotType = 'square', qrCornerSquareType = 'square', qrCornerDotType = 'square', qrLogo,
  topText, bottomText: initialBottomText, vId,
  hotspots: initialHotspots = [],
  activeHotspotId: externalActiveHotspotId = null,
  onHotspotClick: externalOnHotspotClick
}) => {
  const [localBgColor, setLocalBgColor] = useState(initialBgColor);
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);
  const [bottomText, setBottomText] = useState(initialBottomText);
  const [localHotspots, setLocalHotspots] = useState(initialHotspots || []);
  const [internalActiveHotspotId, setInternalActiveHotspotId] = useState(null);

  const activeHotspotId = externalActiveHotspotId !== null && externalActiveHotspotId !== undefined 
    ? externalActiveHotspotId 
    : internalActiveHotspotId;

  const handleHotspotClick = (hs, idx) => {
    const clickedId = hs?.id || idx;
    setInternalActiveHotspotId(prev => prev === clickedId ? null : clickedId);
    if (typeof externalOnHotspotClick === 'function') {
      externalOnHotspotClick(hs, idx);
    }
  };

  React.useEffect(() => {
    if (Array.isArray(initialHotspots) && initialHotspots.length > 0) {
      setLocalHotspots(initialHotspots);
    }
  }, [initialHotspots]);

  React.useEffect(() => {
    setBottomText(initialBottomText);
  }, [initialBottomText]);

  React.useEffect(() => {
    if (typeof dataUrl === 'string' && dataUrl.startsWith('{')) {
      try {
        const parsed = JSON.parse(dataUrl);
        if (Array.isArray(parsed.hotspots) && parsed.hotspots.length > 0) {
          setLocalHotspots(parsed.hotspots);
        }
        if (parsed.displayName || parsed.name) {
          setBottomText(parsed.displayName || parsed.name);
        }
      } catch (e) {}
    }
  }, [dataUrl]);

  const targetVId = vId || (() => {
    if (typeof dataUrl === 'string' && dataUrl.startsWith('{')) {
      try {
        const parsed = JSON.parse(dataUrl);
        return parsed.v_id || parsed.modelId || parsed.sourceModelId || null;
      } catch (_) {}
    }
    return null;
  })();

  React.useEffect(() => {
    if (isOpen && targetVId) {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      axios.get(`${backendUrl}/api/3d-models/get-model/${targetVId}`)
        .then(res => {
           if (res.data && res.data.displayName) {
               setBottomText(res.data.displayName);
           } else if (res.data && res.data.name) {
               setBottomText(res.data.name);
           }
           if (res.data && Array.isArray(res.data.hotspots) && res.data.hotspots.length > 0) {
               setLocalHotspots(res.data.hotspots);
           }
        })
        .catch(err => console.error("Failed to fetch latest 3D model metadata:", err));
    }
  }, [isOpen, targetVId]);

  React.useEffect(() => {
    if (initialBgColor) {
      setLocalBgColor(initialBgColor);
    }
  }, [initialBgColor]);

  const bgColor = externalSetBgColor ? initialBgColor : localBgColor;

  const handleSetBgColor = (color) => {
    setLocalBgColor(color);
    if (externalSetBgColor) {
      externalSetBgColor(color);
    }
  };

  const safeQrValue = React.useMemo(() => {
    if (!dataUrl && !vId) return qrText || "Scan Me";
    
    let resolvedVId = vId || null;
    if (!resolvedVId && typeof dataUrl === 'string' && dataUrl.startsWith('{')) {
      try {
        const parsed = JSON.parse(dataUrl);
        if (parsed.v_id) resolvedVId = parsed.v_id;
        if (parsed.vId) resolvedVId = parsed.vId;
      } catch (e) {}
    }

    if (resolvedVId) {
      return `${window.location.origin}/ar-view?id=${resolvedVId}`;
    }

    if (dataUrl && (dataUrl.startsWith('data:') || dataUrl.startsWith('blob:'))) {
      return "AR View unavailable for local/unsaved models.";
    }

    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    let resolvedUrl = dataUrl;
    if (typeof dataUrl === 'string' && dataUrl.startsWith('/')) {
      resolvedUrl = `${backendUrl}${dataUrl}`;
    } else {
      try {
        resolvedUrl = new URL(dataUrl, window.location.href).href;
      } catch (e) {
        resolvedUrl = dataUrl;
      }
    }
    return `${window.location.origin}/ar-view?url=${encodeURIComponent(resolvedUrl)}`;
  }, [dataUrl, qrText, vId]);

  const resolvedModelUrl = React.useMemo(() => {
    if (!dataUrl) return '';
    let u = dataUrl;
    if (typeof u === 'string' && u.startsWith('{')) {
      try {
        const parsed = JSON.parse(u);
        u = parsed.data || parsed.url || u;
      } catch (e) {}
    }
    if (typeof u === 'string' && u.startsWith('/uploads/')) {
      u = resolveUploadsPath(u);
    }
    return u;
  }, [dataUrl]);

  if (!isOpen) return null;

  return (
    <div className="w-full h-full bg-transparent flex flex-col overflow-hidden p-[0.5vw]">
      <div className="flex-1 bg-white rounded-[1vw] shadow-md relative overflow-hidden flex flex-col pointer-events-auto border border-gray-200">
        
        {/* Top Overlays */}
        <div className="absolute top-[2vw] left-[2.5vw] z-10 flex items-center gap-[1vw] pointer-events-none">
          <span className="text-[1.1vw] font-medium text-gray-800">{topText}</span>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 w-full h-full relative" style={{ backgroundColor: bgType === 'Solid' ? bgColor : 'transparent' }}>
          {resolvedModelUrl ? (
            <GlbModelViewer 
              url={resolvedModelUrl} 
              autoRotate={autoRotate} 
              autoRotateSpeed={autoRotateSpeed} 
              shadowStrength={shadowStrength} 
              shadowSoftness={shadowSoftness} 
              lockMaxZoom={lockMaxZoom} 
              maxZoom={maxZoom} 
              hotspots={localHotspots}
              activeHotspotId={activeHotspotId}
              onHotspotClick={handleHotspotClick}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-gray-400">No Model Data</span>
            </div>
          )}
        </div>

        {/* Bottom Overlays */}
        <div className="absolute bottom-[2vw] left-[2.5vw] right-[2.5vw] z-10 flex items-end justify-between pointer-events-none">
          
          {/* Bottom Left: Adjust BG */}
          <div className="flex items-center pb-[0.5vw] min-w-[15vw] relative">
            {customBg && (
              <div className="flex items-center gap-[0.8vw] pointer-events-auto cursor-pointer" onClick={() => setShowBgColorPicker(true)}>
                <div className="w-[2vw] h-[2vw] rounded-[0.4vw] shadow-sm border border-gray-200" style={{ backgroundColor: bgType === 'Solid' ? bgColor : '#ffffff' }}></div>
                <span className="text-[0.9vw] font-medium text-gray-400">Click to Adjust BG color</span>
              </div>
            )}
            {showBgColorPicker && (
               <>
                 <div className="fixed inset-0 z-[55] cursor-default pointer-events-auto" onClick={(e) => { e.stopPropagation(); setShowBgColorPicker(false); }} />
                 <div className="absolute bottom-[calc(100%+0.5vw)] left-[0vw] z-[60] pointer-events-auto">
                     <ColorPicker 
                         color={bgColor} 
                         onChange={handleSetBgColor} 
                         hidePalette={true}
                         onClose={() => setShowBgColorPicker(false)}
                     />
                 </div>
               </>
            )}
          </div>

          {/* Bottom Center: Machine text */}
          <div className="flex items-center gap-[0.5vw] pointer-events-auto cursor-pointer absolute left-1/2 -translate-x-1/2 bottom-[0.5vw]">
            <span className="text-[1.1vw] font-semibold text-gray-500">{bottomText}</span>
          </div>

          {/* Bottom Right: QR Code */}
          <div className="flex flex-col items-center min-w-[10vw]">
            {enableAR && (
              <div className="flex flex-col items-center gap-[0.2vw] pointer-events-auto cursor-pointer">
                 <div className="w-[4.5vw] h-[4.5vw] rounded-[0.5vw] p-[0.3vw] shadow-sm flex items-center justify-center" style={{ backgroundColor: qrBgType === 'Solid' ? qrBgColor : 'transparent' }}>
                   <CustomQRCode 
                      value={safeQrValue} 
                      size={1024} 
                      margin={0}
                      fgColor={qrColor} 
                      bgColor={qrBgType === 'Solid' ? qrBgColor : 'transparent'} 
                      dotType={qrDotType} 
                      cornerSquareType={qrCornerSquareType} 
                      cornerDotType={qrCornerDotType} 
                      level={qrLevel}
                      logo={qrLogo}
                   />
                 </div>
                 <span className="text-[0.9vw] font-medium text-gray-800">{qrText || "Scan Me"}</span>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Model3DPreviewModal;
