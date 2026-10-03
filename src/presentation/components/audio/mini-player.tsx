"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  HiOutlineArrowUturnLeft,
  HiOutlineArrowUturnRight,
  HiOutlinePause,
  HiOutlinePlay,
  HiOutlineSpeakerWave,
  HiOutlineSpeakerXMark,
  HiOutlineXMark,
} from "react-icons/hi2";
import { useAudioPlayer } from "@/presentation/providers/audio-player-provider";
import { AudioProgressBar, formatAudioTime } from "./audio-progress-bar";

/** Persistent bottom bar — mounted once in the root layout, so it survives
 * client-side navigation and keeps playing while the visitor keeps browsing. */
export function MiniPlayer() {
  const player = useAudioPlayer();

  return (
    <AnimatePresence>
      {player.track ? (
        <motion.div
          initial={{ y: 96, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 96, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="glass fixed inset-x-0 bottom-0 z-40 border-t border-border-subtle shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.15)]"
        >
          <div className="mx-auto flex max-w-[1440px] items-center gap-3 px-4 py-2.5 sm:gap-4 sm:px-6">
            <Link href={`/audios/${player.track.slug}`} className="relative size-11 shrink-0 overflow-hidden rounded-lg sm:size-12">
              <Image src={player.track.coverImage} alt={player.track.title} fill sizes="48px" className="object-cover" />
            </Link>

            <div className="min-w-0 flex-1 sm:flex-none sm:w-48">
              <Link
                href={`/audios/${player.track.slug}`}
                className="line-clamp-1 text-xs font-medium text-foreground transition-colors hover:text-brand-600 sm:text-sm"
              >
                {player.track.title}
              </Link>
              <p className="mt-0.5 hidden text-[11px] tabular-nums text-foreground/45 sm:block">
                {formatAudioTime(player.currentTime)} / {formatAudioTime(player.duration || player.track.durationSeconds)}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-1 sm:gap-2">
              <button
                type="button"
                aria-label="Recuar 10 segundos"
                onClick={() => player.skip(-10)}
                className="hidden size-8 items-center justify-center rounded-full text-foreground/60 transition-colors hover:bg-foreground/5 hover:text-brand-600 sm:inline-flex"
              >
                <HiOutlineArrowUturnLeft className="size-4" />
              </button>
              <button
                type="button"
                aria-label={player.isPlaying ? "Pausar" : "Reproduzir"}
                onClick={player.togglePlay}
                className="flex size-9 items-center justify-center rounded-full bg-brand-600 text-white shadow-sm transition-transform hover:scale-105 sm:size-10"
              >
                {player.isPlaying ? <HiOutlinePause className="size-4.5" /> : <HiOutlinePlay className="size-4.5 translate-x-0.5" />}
              </button>
              <button
                type="button"
                aria-label="Avançar 10 segundos"
                onClick={() => player.skip(10)}
                className="hidden size-8 items-center justify-center rounded-full text-foreground/60 transition-colors hover:bg-foreground/5 hover:text-brand-600 sm:inline-flex"
              >
                <HiOutlineArrowUturnRight className="size-4" />
              </button>
            </div>

            <div className="hidden min-w-0 flex-1 items-center gap-3 md:flex">
              <span className="shrink-0 text-[11px] tabular-nums text-foreground/45">{formatAudioTime(player.currentTime)}</span>
              <AudioProgressBar currentTime={player.currentTime} duration={player.duration || player.track.durationSeconds} onSeek={player.seek} className="flex-1" />
              <span className="shrink-0 text-[11px] tabular-nums text-foreground/45">{formatAudioTime(player.duration || player.track.durationSeconds)}</span>
            </div>

            <button
              type="button"
              aria-label={player.muted ? "Reactivar som" : "Silenciar"}
              onClick={player.toggleMute}
              className="hidden size-8 shrink-0 items-center justify-center rounded-full text-foreground/60 transition-colors hover:bg-foreground/5 hover:text-brand-600 sm:inline-flex"
            >
              {player.muted ? <HiOutlineSpeakerXMark className="size-4.5" /> : <HiOutlineSpeakerWave className="size-4.5" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={player.muted ? 0 : player.volume}
              onChange={(e) => player.setVolume(Number(e.target.value))}
              aria-label="Volume"
              className="hidden w-20 shrink-0 accent-brand-600 lg:block"
            />

            <button
              type="button"
              aria-label="Fechar leitor"
              onClick={player.close}
              className="flex size-8 shrink-0 items-center justify-center rounded-full text-foreground/40 transition-colors hover:bg-foreground/5 hover:text-foreground"
            >
              <HiOutlineXMark className="size-4.5" />
            </button>
          </div>

          {/* Mobile progress bar — full width beneath the controls row */}
          <div className="px-4 pb-2 md:hidden">
            <AudioProgressBar currentTime={player.currentTime} duration={player.duration || player.track.durationSeconds} onSeek={player.seek} />
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
