import React, { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

/**
 * BlenderInfiniteGrid: High-performance, anti-aliased infinite 3D viewport grid.
 *
 * Architecture based on Drei's battle-tested infinite projected grid:
 * 1. Infinite projected plane following camera with zero matrix pop or snap jumping.
 * 2. Rotational-invariant L2 derivatives: length(vec2(dFdx, dFdy)) for smooth orbiting without moire/glitching.
 * 3. Screen-space pixel thickness: lines never break into dots or dashes at any angle.
 * 4. 100% unified origin axes: Red X-axis (Z=0) and Teal Z-axis (X=0) replace grid lines seamlessly.
 * 5. DoubleSide rendering: guaranteed visible from any camera elevation or angle.
 */
export default function BlenderInfiniteGrid({
  cellColor = '#505062',
  sectionColor = '#7a7a92',
  axisColorX = '#ee4444',
  axisColorZ = '#6fab0a',
  cellSize = 1,
  sectionSize = 10,
  fadeDistance = 180,
  fadeStrength = 1.2,
  cellThickness = 1,
  sectionThickness = 1.3,
  axisThickness = 1.3,
  y = 0.0005,
}) {
  const meshRef = useRef();

  const uniforms = useMemo(() => {
    return {
      worldCamProjPosition: { value: new THREE.Vector3() },
      worldPlanePosition: { value: new THREE.Vector3() },
      cellSize: { value: cellSize },
      sectionSize: { value: sectionSize },
      cellColor: { value: new THREE.Color(cellColor) },
      sectionColor: { value: new THREE.Color(sectionColor) },
      axisColorX: { value: new THREE.Color(axisColorX) },
      axisColorZ: { value: new THREE.Color(axisColorZ) },
      fadeDistance: { value: fadeDistance },
      fadeStrength: { value: fadeStrength },
      cellThickness: { value: cellThickness },
      sectionThickness: { value: sectionThickness },
      axisThickness: { value: axisThickness },
    };
  }, []);

  // Update uniforms when props change
  useEffect(() => {
    if (uniforms) {
      uniforms.cellSize.value = cellSize;
      uniforms.sectionSize.value = sectionSize;
      uniforms.cellColor.value.set(cellColor);
      uniforms.sectionColor.value.set(sectionColor);
      uniforms.axisColorX.value.set(axisColorX);
      uniforms.axisColorZ.value.set(axisColorZ);
      uniforms.fadeDistance.value = fadeDistance;
      uniforms.fadeStrength.value = fadeStrength;
      uniforms.cellThickness.value = cellThickness;
      uniforms.sectionThickness.value = sectionThickness;
      uniforms.axisThickness.value = axisThickness;
    }
  }, [
    uniforms,
    cellSize,
    sectionSize,
    cellColor,
    sectionColor,
    axisColorX,
    axisColorZ,
    fadeDistance,
    fadeStrength,
    cellThickness,
    sectionThickness,
    axisThickness,
  ]);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms,
      vertexShader: /* glsl */ `
        varying vec3 localPosition;
        varying vec4 worldPosition;

        uniform vec3 worldCamProjPosition;
        uniform vec3 worldPlanePosition;
        uniform float fadeDistance;

        void main() {
          // Horizontal plane in local space (scaled by fadeDistance for infinite coverage)
          localPosition = position.xzy * (1.0 + fadeDistance);
          worldPosition = modelMatrix * vec4(localPosition, 1.0);

          // Follow camera projection smoothly in world space
          worldPosition.xyz += (worldCamProjPosition - worldPlanePosition);
          localPosition = (inverse(modelMatrix) * worldPosition).xyz;

          gl_Position = projectionMatrix * viewMatrix * worldPosition;
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec3 localPosition;
        varying vec4 worldPosition;

        uniform vec3 worldCamProjPosition;
        uniform float cellSize;
        uniform float sectionSize;
        uniform vec3 cellColor;
        uniform vec3 sectionColor;
        uniform vec3 axisColorX;
        uniform vec3 axisColorZ;
        uniform float fadeDistance;
        uniform float fadeStrength;
        uniform float cellThickness;
        uniform float sectionThickness;
        uniform float axisThickness;

        // Isotropic anti-aliased grid filter
        float getGrid(float size, float thickness) {
          vec2 r = localPosition.xz / size;
          vec2 dX = dFdx(r);
          vec2 dY = dFdy(r);
          vec2 fw = vec2(length(vec2(dX.x, dY.x)), length(vec2(dX.y, dY.y)));
          vec2 grid = abs(fract(r - 0.5) - 0.5) / max(fw, vec2(0.00001));
          float line = min(grid.x, grid.y) + 1.0 - thickness;
          return 1.0 - clamp(line, 0.0, 1.0);
        }

        // Isotropic anti-aliased axis line filter
        float getAxis(float pos, float fwCoord, float thickness) {
          float dist = abs(pos) / max(fwCoord, 0.00001);
          float line = dist + 1.0 - thickness;
          return 1.0 - clamp(line, 0.0, 1.0);
        }

        void main() {
          // 1. Minor grid lines (1 unit)
          float g1 = getGrid(cellSize, cellThickness);

          // 2. Major section lines (10 units)
          float g2 = getGrid(sectionSize, sectionThickness);

          // 3. Screen-space pixel derivatives for axes
          vec2 dX = dFdx(localPosition.xz);
          vec2 dY = dFdy(localPosition.xz);
          vec2 fw = vec2(length(vec2(dX.x, dY.x)), length(vec2(dX.y, dY.y)));

          // Red X-axis line (runs along X, where Z = 0)
          float axisX = getAxis(localPosition.z, fw.y, axisThickness);

          // Teal Z-axis line (runs along Z, where X = 0)
          float axisZ = getAxis(localPosition.x, fw.x, axisThickness);

          // 4. Smooth horizon distance fade
          float dist = distance(worldCamProjPosition, worldPosition.xyz);
          float d = clamp(1.0 - (dist / fadeDistance), 0.0, 1.0);
          float fade = pow(d, fadeStrength);

          if (fade <= 0.001) discard;

          // 5. Composite colors and alpha
          vec3 color = mix(cellColor, sectionColor, clamp(g2 * 1.5, 0.0, 1.0));
          float alpha = (g1 * 0.32 + g2 * 0.68);

          // Overlay True Origin Axes seamlessly (Red along X at Z=0, Teal along Z at X=0)
          if (axisX > 0.001 || axisZ > 0.001) {
            float maxAxis = max(axisX, axisZ);
            vec3 axisCol = mix(axisColorX, axisColorZ, axisZ / max(0.0001, axisX + axisZ));
            color = mix(color, axisCol, maxAxis);
            alpha = mix(alpha, 0.95, maxAxis);
          }

          alpha *= fade;
          if (alpha <= 0.002) discard;

          gl_FragColor = vec4(color, alpha);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
      toneMapped: true,
      extensions: { derivatives: true },
    });
  }, [uniforms]);

  // Project camera smoothly onto ground plane every frame
  const plane = useMemo(() => new THREE.Plane(), []);
  const upVector = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  const zeroVector = useMemo(() => new THREE.Vector3(0, 0, 0), []);

  useFrame(state => {
    if (!meshRef.current) return;
    plane.setFromNormalAndCoplanarPoint(upVector, zeroVector).applyMatrix4(meshRef.current.matrixWorld);
    const gridMaterial = meshRef.current.material;
    if (!gridMaterial || !gridMaterial.uniforms) return;
    plane.projectPoint(state.camera.position, gridMaterial.uniforms.worldCamProjPosition.value);
    gridMaterial.uniforms.worldPlanePosition.value.set(0, 0, 0).applyMatrix4(meshRef.current.matrixWorld);
  });

  return (
    <mesh
      ref={meshRef}
      position={[0, y, 0]}
      material={material}
      renderOrder={-1}
      raycast={() => null}
      frustumCulled={false}
    >
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}
