"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";
import { fadeUp } from "@/presentation/animations/variants";
import { useScrollReveal } from "@/presentation/hooks/use-scroll-reveal";

const TAGS = {
  div: motion.div,
  section: motion.section,
  article: motion.article,
  li: motion.li,
  span: motion.span,
  header: motion.header,
} as const;

interface RevealProps {
  children: ReactNode;
  variants?: Variants;
  as?: keyof typeof TAGS;
  className?: string;
  delay?: number;
}

export function Reveal({ children, variants = fadeUp, as = "div", className, delay = 0 }: RevealProps) {
  const { ref, controls } = useScrollReveal();
  const MotionTag = TAGS[as];

  return (
    <MotionTag
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={variants}
      transition={{ delay }}
      className={className}
    >
      {children}
    </MotionTag>
  );
}

interface RevealGroupProps {
  children: ReactNode;
  className?: string;
  stagger?: number;
  delayChildren?: number;
}

export function RevealGroup({ children, className, stagger = 0.12, delayChildren = 0 }: RevealGroupProps) {
  const { ref, controls } = useScrollReveal();

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: stagger, delayChildren } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({ children, variants = fadeUp, className }: Omit<RevealProps, "delay" | "as">) {
  return (
    <motion.div variants={variants} className={className}>
      {children}
    </motion.div>
  );
}
