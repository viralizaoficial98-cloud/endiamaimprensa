"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { HiOutlineChevronLeft, HiOutlineChevronRight } from "react-icons/hi2";
import type { News } from "@/domain/entities";
import { formatTime } from "@/lib/format";

const ROTATE_MS = 5500;

export function BreakingStrip({ news }: { news: News[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const goTo = useCallback((next: number) => setIndex((next + news.length) % news.length), [news.length]);

  useEffect(() => {
    if (paused || news.length <= 1) return;
    const timeout = setTimeout(() => goTo(index + 1), ROTATE_MS);
    return () => clearTimeout(timeout);
  }, [index, paused, goTo, news.length]);

  if (news.length === 0) return null;
  const current = news[index];

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="mb-8 flex items-center gap-4 rounded-2xl bg-brand-700 px-5 py-3.5 shadow-md shadow-brand-900/10 dark:bg-brand-800"
    >
      <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-500 opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-red-500" />
        </span>
        Última Hora
      </span>

      <div className="relative min-w-0 flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
          >
            <Link href={`/noticia/${current.slug}`} className="group flex min-w-0 items-center gap-3">
              <span className="truncate text-sm font-medium text-white/90 transition-colors group-hover:text-gold-300">
                {current.title}
              </span>
              <span className="shrink-0 text-xs text-white/50">{formatTime(current.publishedAt)}</span>
            </Link>
          </motion.div>
        </AnimatePresence>
      </div>

      {news.length > 1 ? (
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            aria-label="Notícia anterior"
            onClick={() => goTo(index - 1)}
            className="inline-flex size-7 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <HiOutlineChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Próxima notícia"
            onClick={() => goTo(index + 1)}
            className="inline-flex size-7 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <HiOutlineChevronRight className="size-4" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
