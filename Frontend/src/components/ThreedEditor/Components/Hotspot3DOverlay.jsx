import React, { useState, useRef, useMemo, useEffect } from "react";
import * as THREE from "three";
import { useThree, useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { Icon } from "@iconify/react";

/**
 * Hotspot3DOverlay
 * - Evaluates line-of-sight & surface angle in real time
 * - Non-hidden hotspots in user visible area are ACTIVE (full 1.0 opacity, crisp badges, allows multiple)
 * - Hidden hotspots (occluded behind model geometry or facing away) show at reduced 0.2 opacity
 * - Specifically selected hotspot gets highlighted red accent
 */
export default function Hotspot3DOverlay({
  hotspots = [],
  activeHotspotId = null,
  onHotspotClick,
  onDeleteHotspot,
  onEditHotspot,
  sceneWrapperRef
}) {
  const [hoveredId, setHoveredId] = useState(null);
  const [visibleMap, setVisibleMap] = useState({});
  const visibleMapRef = useRef({});
  const lastCheckTimeRef = useRef(0);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);

  // When hotspots are cleared or empty, immediately clear all visibility maps and hovered states
  useEffect(() => {
    if (!hotspots || hotspots.length === 0) {
      setVisibleMap({});
      visibleMapRef.current = {};
      setHoveredId(null);
    }
  }, [hotspots]);

  const { camera } = useThree();

  // Continuously evaluate line-of-sight & surface angle in real time
  useFrame(() => {
    const now = performance.now();
    if (now - lastCheckTimeRef.current < 60) return; // run every 60ms
    lastCheckTimeRef.current = now;

    if (!hotspots || hotspots.length === 0) return;

    // Collect 3D model meshes from sceneWrapperRef to test occlusion against
    const occluderMeshes = [];
    if (sceneWrapperRef && sceneWrapperRef.current) {
      sceneWrapperRef.current.traverse((child) => {
        if ((child.isMesh || child.isSkinnedMesh) && child.visible && child.geometry) {
          occluderMeshes.push(child);
        }
      });
    }

    const nextVis = {};
    const camPos = camera.position;

    // Camera forward vector
    const camForward = new THREE.Vector3();
    camera.getWorldDirection(camForward);

    for (let i = 0; i < hotspots.length; i++) {
      const hs = hotspots[i];
      const hsId = hs.id || `hs_${i}`;
      const posArr = Array.isArray(hs.position)
        ? hs.position
        : (hs.position && typeof hs.position === 'object')
        ? [hs.position.x || 0, hs.position.y || 0, hs.position.z || 0]
        : [0, 0, 0];
      const hsPos = new THREE.Vector3(Number(posArr[0]) || 0, Number(posArr[1]) || 0, Number(posArr[2]) || 0);

      const toHs = hsPos.clone().sub(camPos);
      const dist = toHs.length();

      // Check if behind the camera plane
      if (toHs.dot(camForward) <= 0.1) {
        nextVis[hsId] = false;
        continue;
      }

      const dir = toHs.clone().normalize();

      // Normal angle check: if recorded surface normal faces away from camera, it's back-facing
      if (hs.normal && Array.isArray(hs.normal)) {
        const norm = new THREE.Vector3(hs.normal[0], hs.normal[1], hs.normal[2]).normalize();
        const dot = norm.dot(dir.clone().negate());
        if (dot < -0.12) {
          nextVis[hsId] = false;
          continue;
        }
      }

      // Line-of-sight raycast from camera to hotspot position
      if (occluderMeshes.length > 0) {
        raycaster.set(camPos, dir);
        raycaster.near = 0.1;
        raycaster.far = dist + 0.1;

        const hits = raycaster.intersectObjects(occluderMeshes, false);
        let isBlocked = false;
        for (let h = 0; h < hits.length; h++) {
          // If a mesh is significantly in front of the hotspot (> 0.08 margin to avoid self-intersection)
          if (hits[h].distance < dist - 0.08) {
            isBlocked = true;
            break;
          }
        }
        nextVis[hsId] = !isBlocked;
      } else {
        nextVis[hsId] = true;
      }
    }

    // Only update state when visibility map actually changes
    let changed = false;
    const currentKeys = Object.keys(nextVis);
    const prevKeys = Object.keys(visibleMapRef.current);
    if (currentKeys.length !== prevKeys.length) {
      changed = true;
    } else {
      for (let i = 0; i < currentKeys.length; i++) {
        const k = currentKeys[i];
        if (visibleMapRef.current[k] !== nextVis[k]) {
          changed = true;
          break;
        }
      }
    }

    if (changed) {
      visibleMapRef.current = nextVis;
      setVisibleMap({ ...nextVis });
    }
  });

  if (!hotspots || hotspots.length === 0) return null;

  return (
    <group name="hotspots-overlay-group">
      {hotspots.map((hs, index) => {
        const hsId = hs.id || `hs_${index}`;
        // Specific selection check
        const isSpecificallySelected = activeHotspotId != null && (
          String(activeHotspotId) === String(hs.id) ||
          String(activeHotspotId) === String(hsId) ||
          activeHotspotId === index
        );

        // Visibility in user view area (non-hidden)
        const isNonHidden = visibleMap[hsId] !== false;
        // Non-hidden labels are active! Allows multiple active labels in view area
        const isActive = isSpecificallySelected || isNonHidden;

        const isHovered = hoveredId === hsId;
        const themeColor = hs.color || "#5d5efc";
        const posArr = Array.isArray(hs.position)
          ? hs.position
          : (hs.position && typeof hs.position === 'object')
          ? [hs.position.x || 0, hs.position.y || 0, hs.position.z || 0]
          : [0, 0, 0];
        const pos = [Number(posArr[0]) || 0, Number(posArr[1]) || 0, Number(posArr[2]) || 0];
        const displayLabel = hs.label || hs.meshName || `Hotspot ${index + 1}`;

        // Opacity logic:
        // Non-hidden labels in user visible area = 1.0 (Active)
        // Hidden labels behind model = 0.2 (dimmed)
        const labelOpacity = isSpecificallySelected
          ? 1.0
          : isNonHidden
          ? 1.0
          : 0.2;

        const dotOpacity = isSpecificallySelected
          ? 0.95
          : isNonHidden
          ? 0.9
          : 0.2;

        return (
          <group key={hsId} position={pos}>
            {/* Interactive 3D surface anchor dot */}
            <mesh
              onClick={(e) => {
                e.stopPropagation();
                if (typeof onHotspotClick === "function") {
                  onHotspotClick(hs, index);
                }
              }}
            >
              <sphereGeometry args={[isSpecificallySelected ? 0.024 : 0.018, 16, 16]} />
              <meshBasicMaterial
                color={isSpecificallySelected ? "#ef4444" : themeColor}
                depthTest={false}
                transparent
                opacity={dotOpacity}
              />
            </mesh>

            {/* Fixed-size 2D HTML Screen Overlay */}
            <Html
              center
              zIndexRange={[100, 0]}
              style={{
                pointerEvents: "auto",
                userSelect: "none",
                opacity: labelOpacity,
                transition: "opacity 0.25s ease, transform 0.25s ease",
                willChange: "opacity, transform",
              }}
            >
              <div
                className="flex items-center gap-1.5 cursor-pointer"
                onMouseEnter={() => setHoveredId(hsId)}
                onMouseLeave={() => setHoveredId(null)}
                onPointerDown={(e) => {
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (typeof onHotspotClick === "function") {
                    onHotspotClick(hs, index);
                  }
                }}
              >
                {/* Count circle */}
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: isSpecificallySelected
                      ? "#ef4444"
                      : isNonHidden
                      ? themeColor
                      : "#f3f4f6",
                    border: isSpecificallySelected
                      ? "2.5px solid #ef4444"
                      : isNonHidden
                      ? `2px solid ${themeColor}`
                      : "1.5px solid #d1d5db",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: 11,
                    color: isSpecificallySelected || isNonHidden ? "#fff" : "#9ca3af",
                    boxShadow: isSpecificallySelected
                      ? "0 3px 12px rgba(239,68,68,0.5)"
                      : isNonHidden
                      ? "0 2px 10px rgba(93,94,252,0.3)"
                      : "0 1px 4px rgba(0,0,0,0.08)",
                    transform: isSpecificallySelected ? "scale(1.12)" : isHovered ? "scale(1.05)" : "scale(1)",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease",
                    flexShrink: 0,
                  }}
                >
                  {index + 1}
                </div>

                {/* Label badge */}
                <div
                  style={{
                    padding: "4px 10px",
                    borderRadius: 7,
                    background: isNonHidden ? "#ffffff" : "rgba(255,255,255,0.75)",
                    border: isSpecificallySelected
                      ? "2px solid #ef4444"
                      : isNonHidden
                      ? `1.5px solid ${themeColor}`
                      : "1px solid #e5e7eb",
                    fontSize: 13,
                    fontWeight: 600,
                    color: isNonHidden ? "#111827" : "#9ca3af",
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    boxShadow: isSpecificallySelected
                      ? "0 4px 16px rgba(239,68,68,0.22)"
                      : isNonHidden
                      ? "0 3px 12px rgba(0,0,0,0.12)"
                      : "none",
                    transition: "border-color 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease",
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="whitespace-nowrap">{displayLabel}</span>

                    {/* Quick delete on hover */}
                    {isHovered && typeof onDeleteHotspot === "function" && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteHotspot(hs.id || hsId);
                        }}
                        style={{
                          marginLeft: 2,
                          padding: "2px 3px",
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          color: "#9ca3af",
                          display: "flex",
                          alignItems: "center",
                          borderRadius: 4,
                        }}
                        title="Remove Hotspot"
                      >
                        <Icon icon="heroicons:x-mark" width="12px" height="12px" />
                      </button>
                    )}
                  </div>

                  {isSpecificallySelected && hs.description && (
                    <div className="text-[11px] font-normal text-gray-600 max-w-[200px] leading-tight pb-0.5">
                      {hs.description}
                    </div>
                  )}
                </div>
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}
