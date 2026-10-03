"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { HiBookmark, HiOutlineBookmark } from "react-icons/hi2";
import { cn } from "@/lib/utils";

export function BookmarkButton({ className, label = "Guardar" }: { className?: string; label?: string }) {
  const [saved, setSaved] = useState(false);

  return (
    <motion.button
      type="button"
      aria-pressed={saved}
      aria-label={label}
      whileTap={{ scale: 0.85 }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setSaved((prev) => !prev);
      }}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-full border border-border-subtle bg-surface/80 text-foreground/70 transition-colors hover:border-brand-500 hover:text-brand-600 dark:hover:text-brand-400",
        saved && "border-gold-500 text-gold-500",
        className
      )}
    >
      {saved ? <HiBookmark className="size-4" /> : <HiOutlineBookmark className="size-4" />}
    </motion.button>
  );
}
