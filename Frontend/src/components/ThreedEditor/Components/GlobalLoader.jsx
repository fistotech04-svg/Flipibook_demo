import React from "react";
import { useProgress } from "@react-three/drei";
import * as THREE from "three";

// Patch Three.js DefaultLoadingManager so that errored items count as
// "done" instead of leaving the manager permanently active.
// This fixes the stuck-at-99% issue when external textures fail to load.
if (typeof THREE !== "undefined" && THREE.DefaultLoadingManager) {
    const mgr = THREE.DefaultLoadingManager;
    if (!mgr._errorPatchApplied) {
        mgr._errorPatchApplied = true;
        const origOnError = mgr.onError;
        mgr.onError = function (url) {
            // Complete the item so the manager's loaded count increments
            try { mgr.itemEnd(url); } catch (_) {}
            if (typeof origOnError === "function") origOnError.call(this, url);
        };
    }
}

// Reusable Loading Spinner
export const LoadingSpinner = ({ text = "Loading...", dark = false }) => (
    <div className={`absolute inset-0 w-full h-full flex flex-col items-center justify-center backdrop-blur-md transition-all duration-300 z-[9999] ${dark ? 'bg-gray-900/40' : 'bg-gray-50/70'}`}>
        <div className={`w-[2.1vw] h-[2.1vw] border-[0.3vw] rounded-full animate-spin ${dark ? 'border-white/20 border-t-white' : 'border-indigo-600/30 border-t-indigo-600'}`}></div>
        <span className={`mt-4 text-[0.85vw] font-medium tracking-wide ${dark ? 'text-white/90' : 'text-gray-500'}`}>{text}</span>
    </div>
);

// Global Loader with Smooth 60fps Percentage Interpolation & Rich Aesthetics
export const GlobalLoader = ({
  manualLoading = false,
  text = "",
  progress,
  stage = "",
  modelInfo = null,
  dark = true
}) => {
  const { active: dreiActive, progress: dreiProgress } = useProgress();
  const [shouldRender, setShouldRender] = React.useState(false);
  const [isFadingOut, setIsFadingOut] = React.useState(false);
  const [displayProgress, setDisplayProgress] = React.useState(8);
  
  const displayProgressRef = React.useRef(8);
  const targetProgressRef = React.useRef(8);
  const stuckTimerRef = React.useRef(null);
  const rafIdRef = React.useRef(null);

  // The loader is ONLY active when explicitly requested via manualLoading.
  // Drei's loading manager progress is used to inform the percentage WHILE manualLoading is true,
  // preventing background texture/asset loads from freezing the editor at "Loading Model... 0%".
  const isActive = Boolean(manualLoading);

  // Compute target progress
  let target = 8;
  if (progress !== undefined && progress !== null && Number(progress) > 0) {
    target = Math.max(8, Math.min(100, Number(progress)));
  } else if (manualLoading) {
    target = Math.max(15, Math.min(95, Math.round(dreiProgress || 0)));
  }
  targetProgressRef.current = target;

  // Mount/unmount with smooth fade transition
  React.useEffect(() => {
    let fadeTimer;
    if (isActive) {
      setShouldRender(true);
      setIsFadingOut(false);
      // Reset starting progress to at least 8% on new activation
      if (displayProgressRef.current < 8) {
        displayProgressRef.current = 8;
        setDisplayProgress(8);
      }
    } else if (shouldRender) {
      // Only trigger fade out if it was actually showing
      setIsFadingOut(true);
      fadeTimer = setTimeout(() => {
        setShouldRender(false);
        setIsFadingOut(false);
        setDisplayProgress(8);
        displayProgressRef.current = 8;
      }, 300);
    }
    return () => clearTimeout(fadeTimer);
  }, [isActive, shouldRender]);

  // Smooth 60 FPS RequestAnimationFrame lerping for perfect percentage counter
  React.useEffect(() => {
    if (!shouldRender) {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      return;
    }

    const animate = () => {
      const current = displayProgressRef.current;
      const target = targetProgressRef.current;
      const diff = target - current;

      if (Math.abs(diff) < 0.25) {
        displayProgressRef.current = target;
        setDisplayProgress(target);
      } else {
        // Monotonic forward progression: smoothly step forward towards target
        if (diff > 0) {
          const step = Math.max(0.25, diff * 0.22);
          const next = Math.min(target, current + step);
          displayProgressRef.current = next;
          setDisplayProgress(next);
        } else if (target <= 8) {
          // Snap down only when explicitly resetting/reinitializing
          displayProgressRef.current = target;
          setDisplayProgress(target);
        }
      }

      rafIdRef.current = requestAnimationFrame(animate);
    };

    rafIdRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [shouldRender]);

  // Safety stuck timer — auto-recovers after 15 minutes max if manualLoading is somehow stuck
  React.useEffect(() => {
    if (!isActive) {
      if (stuckTimerRef.current) clearTimeout(stuckTimerRef.current);
      return;
    }
    stuckTimerRef.current = setTimeout(() => {
      console.warn("[GlobalLoader] Max loading safety limit reached (15 mins) — auto-dismissing.");
      setIsFadingOut(true);
      setTimeout(() => setShouldRender(false), 300);
    }, 15 * 60 * 1000);

    return () => {
      if (stuckTimerRef.current) clearTimeout(stuckTimerRef.current);
    };
  }, [isActive]);

  if (!shouldRender) return null;

  const roundedPct = Math.round(displayProgress);
  const isComplete = roundedPct >= 100;
  const displayPct = Math.max(8, roundedPct);

  // Determine stage text and sanitize duplicate percentage tokens
  const defaultStage = modelInfo?.type
    ? `Loading ${modelInfo.type.toUpperCase()} model...`
    : "Loading 3D model...";

  const rawLabel = stage || text || defaultStage;
  const cleanPrefix = rawLabel
    .replace(/\(\s*\d+%\s*-\s*(chunk\s*\d+\/\d+)\)/gi, '($1)')
    .replace(/\s*\(\s*\d+%\s*\)/gi, '')
    .replace(/\s*\d+%/g, '')
    .trim();

  const loadingLabel = isComplete
    ? "Model ready on base! 100%"
    : `${cleanPrefix} ${displayPct}%`;

  return (
    <div className={`absolute inset-0 z-[9999] pointer-events-auto transition-opacity duration-300 ${isFadingOut ? 'opacity-0' : 'opacity-100'}`}>
      <LoadingSpinner 
        text={loadingLabel} 
        dark={false} 
      />
    </div>
  );
};

