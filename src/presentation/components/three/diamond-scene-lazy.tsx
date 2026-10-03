"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const DiamondScene = dynamic(() => import("./diamond-scene").then((mod) => mod.DiamondScene), { ssr: false });

/** Purely decorative (hidden below the `sm` breakpoint already, low-opacity,
 * mix-blend-screen) — three.js + @react-three/fiber + drei is a heavy chunk,
 * so it's fetched only after the browser is idle rather than racing the
 * Hero's LCP image and title for bandwidth/main-thread time. */
export function DiamondSceneLazy({ className }: { className?: string }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || window.innerWidth < 640) return;
    const w = window as Window & { requestIdleCallback?: (cb: () => void) => number };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(() => setReady(true));
      return () => (window as Window & { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback?.(id);
    }
    const timeout = setTimeout(() => setReady(true), 1500);
    return () => clearTimeout(timeout);
  }, []);

  if (!ready) return null;
  return <DiamondScene className={className} />;
}
