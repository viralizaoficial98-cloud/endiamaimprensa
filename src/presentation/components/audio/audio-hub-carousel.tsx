"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { HiChevronLeft, HiChevronRight, HiOutlinePause, HiOutlinePlay } from "react-icons/hi2";
import type { EndiamaAudio } from "@/domain/entities";
import { useAudioPlayer } from "@/presentation/providers/audio-player-provider";
import { formatAudioTime } from "./audio-progress-bar";
import { AudioWaveform } from "./audio-waveform";

const PAGE_SIZE = 4;
const AUTO_ADVANCE_MS = 6000;

function toTrack(audio: EndiamaAudio) {
  return {
    id: audio.id,
    slug: audio.slug,
    title: audio.title,
    coverImage: audio.coverImage,
    audioUrl: audio.audioUrl,
    durationSeconds: audio.durationSeconds,
  };
}

/** Right panel of the "Central de Áudio" — a compact, title-first rotating
 * list (never a photo grid). Auto-advances every ~6s but freezes the instant
 * something is playing, so listening is never interrupted mid-track. */
export function AudioHubCarousel({ audios }: { audios: EndiamaAudio[] }) {
  const player = useAudioPlayer();
  const pages = useMemo(() => {
    // Balanced split (not a fixed-size final remainder) so a trailing page
    // never ends up with just one lonely row under otherwise-full pages.
    const pageCount = Math.max(1, Math.ceil(audios.length / PAGE_SIZE));
    const baseSize = Math.ceil(audios.length / pageCount);
    const chunks: EndiamaAudio[][] = [];
    for (let i = 0; i < audios.length; i += baseSize) chunks.push(audios.slice(i, i + baseSize));
    return chunks;
  }, [audios]);
  const pageCount = pages.length;

  const [pageIndex, setPageIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const touchStartX = useRef<number | null>(null);

  function goTo(next: number, dir: 1 | -1) {
    setDirection(dir);
    setPageIndex((next + pageCount) % pageCount);
  }

  useEffect(() => {
    if (pageCount <= 1 || player.isPlaying) return;
    const timer = setTimeout(() => goTo(pageIndex + 1, 1), AUTO_ADVANCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIndex, pageCount, player.isPlaying]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowRight") goTo(pageIndex + 1, 1);
      if (e.key === "ArrowLeft") goTo(pageIndex - 1, -1);
    }
    const el = document.getElementById("audio-hub-carousel");
    el?.addEventListener("keydown", onKeyDown);
    return () => el?.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIndex]);

  if (audios.length === 0) return null;
  const current = pages[pageIndex] ?? [];

  return (
    <div id="audio-hub-carousel" tabIndex={0} className="flex h-full flex-col outline-none">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground/50 dark:text-white/45">Em Destaque</p>
        {pageCount > 1 ? (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label="Destaques anteriores"
              onClick={() => goTo(pageIndex - 1, -1)}
              className="flex size-7 items-center justify-center rounded-full text-foreground/40 transition-colors hover:bg-foreground/5 hover:text-brand-600 dark:text-white/40 dark:hover:bg-white/10 dark:hover:text-gold-300"
            >
              <HiChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Próximos destaques"
              onClick={() => goTo(pageIndex + 1, 1)}
              className="flex size-7 items-center justify-center rounded-full text-foreground/40 transition-colors hover:bg-foreground/5 hover:text-brand-600 dark:text-white/40 dark:hover:bg-white/10 dark:hover:text-gold-300"
            >
              <HiChevronRight className="size-4" />
            </button>
          </div>
        ) : null}
      </div>

      <div
        className="relative mt-3 flex-1 overflow-hidden"
        onTouchStart={(e) => (touchStartX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchStartX.current === null) return;
          const delta = e.changedTouches[0].clientX - touchStartX.current;
          if (Math.abs(delta) > 40) goTo(pageIndex + (delta < 0 ? 1 : -1), delta < 0 ? 1 : -1);
          touchStartX.current = null;
        }}
      >
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={pageIndex}
            custom={direction}
            initial={{ opacity: 0, x: direction * 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -24 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-2"
          >
            {current.map((audio, i) => {
              const isActive = player.track?.id === audio.id;
              const isActivePlaying = isActive && player.isPlaying;
              return (
                <div
                  key={audio.id}
                  className="group flex items-center gap-3 rounded-xl border border-transparent px-2 py-2 transition-all hover:-translate-y-0.5 hover:border-border-subtle hover:bg-surface dark:hover:bg-white/5"
                >
                  <span className="w-4 shrink-0 text-center text-[11px] font-semibold tabular-nums text-foreground/30 dark:text-white/30">
                    {String(pageIndex * PAGE_SIZE + i + 1).padStart(2, "0")}
                  </span>

                  <div className="relative size-16 shrink-0 overflow-hidden rounded-lg">
                    <Image src={audio.coverImage} alt={audio.title} fill sizes="70px" loading="lazy" className="object-cover" />
                  </div>

                  <Link href={`/audios/${audio.slug}`} className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-medium text-foreground transition-colors group-hover:text-brand-600 dark:text-white dark:group-hover:text-gold-300">
                      {audio.title}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-foreground/45 dark:text-white/40">
                      {isActivePlaying ? (
                        <span className="inline-flex items-center gap-1 font-medium text-brand-600 dark:text-gold-400">
                          <span className="relative flex size-1.5">
                            <span className="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-75" />
                            <span className="relative inline-flex size-1.5 rounded-full bg-current" />
                          </span>
                          A reproduzir
                        </span>
                      ) : (
                        <>
                          {audio.category ? <span>{audio.category.name}</span> : null}
                          <span>•</span>
                          <span className="tabular-nums">{formatAudioTime(audio.durationSeconds)}</span>
                        </>
                      )}
                    </p>
                  </Link>

                  {isActivePlaying ? (
                    <AudioWaveform active className="mr-1 hidden text-brand-600 dark:text-gold-400 sm:flex" />
                  ) : null}

                  <button
                    type="button"
                    aria-label={isActivePlaying ? "Pausar áudio" : "Reproduzir áudio"}
                    onClick={() => (isActive ? player.togglePlay() : player.play(toTrack(audio)))}
                    className="flex size-8 shrink-0 items-center justify-center rounded-full text-foreground/50 transition-all hover:scale-110 hover:bg-brand-600/10 hover:text-brand-600 dark:text-white/50 dark:hover:bg-gold-400/10 dark:hover:text-gold-300"
                  >
                    {isActivePlaying ? <HiOutlinePause className="size-4" /> : <HiOutlinePlay className="size-4 translate-x-0.5" />}
                  </button>
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      {pageCount > 1 ? (
        <div className="mt-3 flex items-center justify-center gap-1.5">
          {pages.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Ir para página ${i + 1}`}
              onClick={() => goTo(i, i > pageIndex ? 1 : -1)}
              className={`h-1.5 rounded-full transition-all ${
                i === pageIndex ? "w-5 bg-brand-600 dark:bg-gold-400" : "w-1.5 bg-foreground/15 dark:bg-white/20"
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
