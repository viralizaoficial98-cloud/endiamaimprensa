"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { DiamondMesh } from "./diamond-mesh";

export function DiamondScene({ className }: { className?: string }) {
  return (
    <div className={className} aria-hidden>
      <Canvas
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true }}
        camera={{ position: [0, 0, 5], fov: 40 }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 4, 5]} intensity={1.4} color="#ffffff" />
        <pointLight position={[-3, -2, 2]} intensity={1.1} color="#c9a24b" />
        <Suspense fallback={null}>
          <DiamondMesh />
        </Suspense>
      </Canvas>
    </div>
  );
}
