"use client";

import { useAnimation, useReducedMotion } from "framer-motion";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";

interface UseScrollRevealOptions {
  threshold?: number;
  rootMargin?: string;
}

/**
 * Drives a Framer Motion `animate` controller from an Intersection Observer,
 * firing the "visible" state exactly once when the element enters the
 * viewport. Respects prefers-reduced-motion by skipping straight to the
 * final state.
 */
export function useScrollReveal(options: UseScrollRevealOptions = {}) {
  const { threshold = 0.2, rootMargin = "0px 0px -10% 0px" } = options;
  const controls = useAnimation();
  const prefersReducedMotion = useReducedMotion();
  const { ref, inView } = useInView({ threshold, rootMargin, triggerOnce: true });

  useEffect(() => {
    if (prefersReducedMotion) {
      controls.set("visible");
      return;
    }
    if (inView) {
      controls.start("visible");
    }
  }, [inView, controls, prefersReducedMotion]);

  return { ref, controls, inView };
}
