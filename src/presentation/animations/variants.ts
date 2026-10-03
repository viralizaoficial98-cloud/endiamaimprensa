import type { Variants } from "framer-motion";

export const EASE_ELEGANT = [0.16, 1, 0.3, 1] as const;
export const EASE_SPRING = { type: "spring", stiffness: 220, damping: 22 } as const;
export const EASE_ELASTIC = { type: "spring", stiffness: 180, damping: 12, mass: 0.9 } as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE_ELEGANT } },
};

export const fadeDown: Variants = {
  hidden: { opacity: 0, y: -32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE_ELEGANT } },
};

export const fadeLeft: Variants = {
  hidden: { opacity: 0, x: 48 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: EASE_ELEGANT } },
};

export const fadeRight: Variants = {
  hidden: { opacity: 0, x: -48 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: EASE_ELEGANT } },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.8, ease: EASE_ELEGANT } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: EASE_ELEGANT } },
};

export const zoomIn: Variants = {
  hidden: { opacity: 0, scale: 1.08 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.9, ease: EASE_ELEGANT } },
};

export const rotateIn: Variants = {
  hidden: { opacity: 0, rotate: -3, y: 20 },
  visible: { opacity: 1, rotate: 0, y: 0, transition: { duration: 0.7, ease: EASE_ELEGANT } },
};

export const springUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: EASE_SPRING },
};

export const elasticIn: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: EASE_ELASTIC },
};

export function staggerContainer(stagger = 0.12, delayChildren = 0): Variants {
  return {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: stagger,
        delayChildren,
      },
    },
  };
}

export const letterContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.028 } },
};

export const letterChild: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE_ELEGANT } },
};

export const buttonTap = {
  whileHover: { scale: 1.03 },
  whileTap: { scale: 0.97 },
  transition: EASE_SPRING,
};
