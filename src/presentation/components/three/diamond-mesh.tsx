"use client";

import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import type { Mesh } from "three";

export function DiamondMesh() {
  const meshRef = useRef<Mesh>(null);
  const [reducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  const pointer = useRef({ x: 0, y: 0 });

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    if (!reducedMotion) {
      meshRef.current.rotation.y += delta * 0.35;
      meshRef.current.rotation.x = 0.35 + Math.sin(state.clock.elapsedTime * 0.4) * 0.08;
    }
    pointer.current.x = state.pointer.x;
    pointer.current.y = state.pointer.y;
    meshRef.current.position.x += (pointer.current.x * 0.3 - meshRef.current.position.x) * 0.04;
    meshRef.current.position.y += (pointer.current.y * 0.2 - meshRef.current.position.y) * 0.04;
  });

  return (
    <mesh ref={meshRef} rotation={[0.35, 0, 0]}>
      <octahedronGeometry args={[1.3, 0]} />
      <meshPhysicalMaterial
        color="#eafaf1"
        roughness={0.05}
        metalness={0.1}
        transmission={0.9}
        thickness={1.4}
        ior={2.4}
        clearcoat={1}
        clearcoatRoughness={0.05}
        attenuationColor="#2fa968"
        attenuationDistance={0.6}
      />
    </mesh>
  );
}
