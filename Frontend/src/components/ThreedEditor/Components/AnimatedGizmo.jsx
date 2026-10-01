import React, { useState } from "react";
import { useFrame } from "@react-three/fiber";
import { GizmoHelper, GizmoViewport } from "@react-three/drei";

export default function AnimatedGizmo({ isTextureOpen, activeTab }) {
  const getTarget = () => {
    if (activeTab === "custom") return [80, 80]; // Closer to corner when gallery is gone
    return isTextureOpen ? [120, 255] : [65, 110];
  };

  const [margin, setMargin] = useState(getTarget());
  
  useFrame((state, delta) => {
    const target = getTarget();
    
    // Calculate distance to target
    const dist = Math.sqrt(Math.pow(target[0] - margin[0], 2) + Math.pow(target[1] - margin[1], 2));
    
    // Stop updating if close enough
    if (dist < 1) {
       if (margin[0] !== target[0] || margin[1] !== target[1]) {
           setMargin(target);
       }
       return;
    }
    
    // Smooth interpolation speed (higher is faster)
    const speed = 9;
    
    setMargin([
      margin[0] + (target[0] - margin[0]) * speed * delta,
      margin[1] + (target[1] - margin[1]) * speed * delta
    ]);
  });

  return (
    <GizmoHelper
      alignment="bottom-right"
      margin={margin}
    >
      <GizmoViewport
        axisColors={["#ff3653", "#2c8fff", "#8adb00"]}
        labels={["X", "Z", "Y"]}
        labelColor="white"
      />
    </GizmoHelper>
  );
}
