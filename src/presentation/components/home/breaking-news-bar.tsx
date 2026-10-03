"use client";

import Link from "next/link";
import { useState } from "react";
import { HiBolt, HiOutlinePause, HiOutlinePlay } from "react-icons/hi2";
import type { News } from "@/domain/entities";
import { cn } from "@/lib/utils";

export function BreakingNewsBar({ news }: { news: News[] }) {
  const [paused, setPaused] = useState(false);
  if (news.length === 0) return null;
  const items = [...news, ...news];

  return (
    <div className="relative z-20 flex items-center gap-4 overflow-hidden border-b border-border-subtle bg-brand-700 py-2.5 text-white">
      <span className="ml-5 flex shrink-0 items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wide">
        <HiBolt className="size-3.5 animate-pulse text-gold-300" />
        Última Hora
      </span>
      <div className="group relative min-w-0 flex-1 overflow-hidden" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
        <div
          className={cn("animate-marquee flex w-max gap-12", paused && "[animation-play-state:paused]")}
          role="marquee"
          aria-label="Notícias de última hora"
        >
          {items.map((item, i) => (
            <Link
              key={`${item.id}-${i}`}
              href={`/noticia/${item.slug}`}
              className="whitespace-nowrap text-sm font-medium text-white/90 transition-colors hover:text-gold-300"
            >
              {item.title}
            </Link>
          ))}
        </div>
      </div>
      <button
        type="button"
        onClick={() => setPaused((v) => !v)}
        aria-label={paused ? "Retomar última hora" : "Pausar última hora"}
        className="mr-5 inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-white/25 text-white/80 transition-colors hover:border-white hover:text-white"
      >
        {paused ? <HiOutlinePlay className="size-3.5" /> : <HiOutlinePause className="size-3.5" />}
      </button>
    </div>
  );
}
