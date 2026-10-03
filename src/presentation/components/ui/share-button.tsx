"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { HiCheck, HiOutlineShare } from "react-icons/hi2";
import { cn } from "@/lib/utils";

export function ShareButton({
  title,
  className,
  variant = "icon",
}: {
  title: string;
  className?: string;
  variant?: "icon" | "full";
}) {
  const [copied, setCopied] = useState(false);

  async function handleShare(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // user cancelled or unsupported — fall through to clipboard
      }
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (variant === "full") {
    return (
      <motion.button
        type="button"
        whileTap={{ scale: 0.96 }}
        onClick={handleShare}
        className={cn(
          "inline-flex items-center gap-2 rounded-full border border-border-subtle px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-brand-500 hover:text-brand-600 dark:hover:text-brand-400",
          className
        )}
      >
        {copied ? <HiCheck className="size-4" /> : <HiOutlineShare className="size-4" />}
        {copied ? "Copiado!" : "Partilhar"}
      </motion.button>
    );
  }

  return (
    <motion.button
      type="button"
      aria-label="Partilhar"
      whileTap={{ scale: 0.85 }}
      onClick={handleShare}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-full border border-border-subtle bg-surface/80 text-foreground/70 transition-colors hover:border-brand-500 hover:text-brand-600 dark:hover:text-brand-400",
        className
      )}
    >
      {copied ? <HiCheck className="size-4" /> : <HiOutlineShare className="size-4" />}
    </motion.button>
  );
}
