"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { HiHeart, HiOutlineHeart } from "react-icons/hi2";
import { formatCompactNumber } from "@/lib/format";

export function LikeButton({ initialLikes }: { initialLikes: number }) {
  const [liked, setLiked] = useState(false);
  const total = initialLikes + (liked ? 1 : 0);

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.9 }}
      onClick={() => setLiked((v) => !v)}
      aria-pressed={liked}
      className="inline-flex items-center gap-2 rounded-full border border-border-subtle px-4 py-2 text-sm font-semibold text-foreground/70 transition-colors hover:border-red-400 hover:text-red-500"
    >
      <motion.span animate={liked ? { scale: [1, 1.4, 1] } : { scale: 1 }} transition={{ duration: 0.35 }}>
        {liked ? <HiHeart className="size-4 text-red-500" /> : <HiOutlineHeart className="size-4" />}
      </motion.span>
      {formatCompactNumber(total)}
    </motion.button>
  );
}
