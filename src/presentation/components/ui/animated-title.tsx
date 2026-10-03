"use client";

import { motion } from "framer-motion";
import { letterChild, letterContainer } from "@/presentation/animations/variants";
import { cn } from "@/lib/utils";

export function AnimatedTitle({
  text,
  className,
  delay = 0,
  instant = false,
}: {
  text: string;
  className?: string;
  delay?: number;
  /** Skips the letter-by-letter reveal so the title paints immediately — used for the
   * very first Hero slide, which is the page's LCP text and must never sit invisible. */
  instant?: boolean;
}) {
  const words = text.split(" ");

  return (
    <motion.h1
      initial={instant ? false : "hidden"}
      animate="visible"
      variants={{ ...letterContainer, visible: { transition: { staggerChildren: 0.028, delayChildren: delay } } }}
      className={cn("flex flex-wrap", className)}
      aria-label={text}
    >
      {words.map((word, wordIndex) => (
        <span key={wordIndex} className="mr-[0.28em] flex overflow-hidden">
          {word.split("").map((letter, letterIndex) => (
            <motion.span key={letterIndex} variants={letterChild} className="inline-block">
              {letter}
            </motion.span>
          ))}
        </span>
      ))}
    </motion.h1>
  );
}
