import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { useThree, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

/**
 * SmoothOrbitControls
 * Provides ultra-smooth 60-120fps camera rotation with natural inertial coasting / momentum,
 * and intelligent boundary protection to prevent zooming inside the 3D model.
 */
const SmoothOrbitControls = React.forwardRef(({
  autoRotate = false,
  dampingFactor = 0.08,
  momentumFriction = 0.95,
  rotateSpeed = 1.0,
  minDistance = 1.4,
  maxDistance = 25,
  sceneWrapperRef,
  onChange,
  onStart,
  onEnd,
  ...props
}, forwardedRef) => {
  const innerRef = useRef(null);
  const controlsRef = forwardedRef || innerRef;

  const gl = useThree((state) => state.gl);
  const domElement = gl?.domElement;

  // Velocity tracking & momentum coasting refs
  const isInteractingRef = useRef(false);
  const isCoastingRef = useRef(false);
  const velocityRef = useRef({ x: 0, y: 0 });
  const lastPointerRef = useRef({ x: 0, y: 0, time: 0 });
  const recentDeltasRef = useRef([]);


  // 1. Pointer Event Handlers for Velocity Tracking
  useEffect(() => {
    if (!domElement) return;

    const handlePointerDown = (e) => {
      // Zero out any existing coasting when user touches down
      isCoastingRef.current = false;
      velocityRef.current = { x: 0, y: 0 };
      recentDeltasRef.current = [];

      // Only track left-click (rotate) or single touch
      if (e.pointerType === "mouse" && e.button !== 0) return;

      isInteractingRef.current = true;
      lastPointerRef.current = {
        x: e.clientX,
        y: e.clientY,
        time: performance.now()
      };
    };

    const handlePointerMove = (e) => {
      if (!isInteractingRef.current) return;

      const now = performance.now();
      const dt = now - lastPointerRef.current.time;
      if (dt <= 0) return;

      const dx = e.clientX - lastPointerRef.current.x;
      const dy = e.clientY - lastPointerRef.current.y;

      lastPointerRef.current = { x: e.clientX, y: e.clientY, time: now };

      // Keep recent samples within last 65ms for responsive release velocity
      const sample = { dx, dy, dt, time: now };
      recentDeltasRef.current.push(sample);
      const cutoff = now - 65;
      recentDeltasRef.current = recentDeltasRef.current.filter((s) => s.time >= cutoff);
    };

    const handlePointerUp = () => {
      if (!isInteractingRef.current) return;
      isInteractingRef.current = false;

      const now = performance.now();
      // Only recent movements within 65ms count as a flick/swipe
      const validSamples = recentDeltasRef.current.filter((s) => now - s.time < 65);

      if (validSamples.length >= 2) {
        let totalDx = 0;
        let totalDy = 0;
        let totalDt = 0;

        validSamples.forEach((s) => {
          totalDx += s.dx;
          totalDy += s.dy;
          totalDt += s.dt;
        });

        if (totalDt > 5) {
          const clientHeight = domElement.clientHeight || window.innerHeight || 800;
          // Radians per millisecond
          const radFactor = ((2 * Math.PI) / clientHeight) * rotateSpeed;
          const vx = (totalDx / totalDt) * radFactor;
          const vy = (totalDy / totalDt) * radFactor;

          const speed = Math.hypot(vx, vy);
          // Minimum speed threshold to trigger coasting
          if (speed > 0.00015) {
            velocityRef.current = {
              x: Math.max(-0.02, Math.min(0.02, vx)),
              y: Math.max(-0.02, Math.min(0.02, vy))
            };
            isCoastingRef.current = true;
          }
        }
      }

      recentDeltasRef.current = [];
    };

    domElement.addEventListener("pointerdown", handlePointerDown, { passive: true });
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerup", handlePointerUp, { passive: true });
    window.addEventListener("pointercancel", handlePointerUp, { passive: true });

    return () => {
      domElement.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [domElement, rotateSpeed]);

  // Momentum Coasting Animation in useFrame
  useFrame((state, delta) => {
    const ctrl = controlsRef.current;

    // 2. Momentum Coasting
    // If autoRotate is on or user is currently dragging, don't coast
    if (autoRotate || isInteractingRef.current) {
      isCoastingRef.current = false;
      return;
    }

    if (!isCoastingRef.current) return;
    if (!ctrl || typeof ctrl.getAzimuthalAngle !== "function") return;

    // Frame step in milliseconds (clamped to prevent jumps on tab focus)
    const dtMs = Math.min(32, delta * 1000);
    const stepTheta = velocityRef.current.x * dtMs;
    const stepPhi = velocityRef.current.y * dtMs;

    const curTheta = ctrl.getAzimuthalAngle();
    const curPhi = ctrl.getPolarAngle();

    // Apply rotation
    ctrl.setAzimuthalAngle(curTheta - stepTheta);

    const minPolar = ctrl.minPolarAngle ?? 0.001;
    const maxPolar = ctrl.maxPolarAngle ?? (Math.PI - 0.001);
    const targetPhi = Math.max(minPolar, Math.min(maxPolar, curPhi - stepPhi));
    ctrl.setPolarAngle(targetPhi);

    // Apply smooth exponential friction decay (0.95 per 60hz frame)
    const friction = Math.pow(momentumFriction, delta * 60);
    velocityRef.current.x *= friction;
    velocityRef.current.y *= friction;

    // Graceful stop threshold
    if (Math.hypot(velocityRef.current.x, velocityRef.current.y) < 0.00002) {
      isCoastingRef.current = false;
      velocityRef.current = { x: 0, y: 0 };
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      autoRotate={autoRotate}
      enableDamping={true}
      dampingFactor={dampingFactor}
      rotateSpeed={rotateSpeed}
      minDistance={minDistance}
      maxDistance={maxDistance}
      onChange={onChange}
      onStart={onStart}
      onEnd={onEnd}
      {...props}
    />
  );
});

export default SmoothOrbitControls;
