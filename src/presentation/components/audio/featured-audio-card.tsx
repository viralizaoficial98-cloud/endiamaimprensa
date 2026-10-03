"use client";

import Image from "next/image";
import Link from "next/link";
import { HiOutlineCalendarDays, HiOutlinePause, HiOutlinePlay } from "react-icons/hi2";
import type { EndiamaAudio } from "@/domain/entities";
import { formatDate } from "@/lib/format";
import { useAudioPlayer } from "@/presentation/providers/audio-player-provider";
import { AudioProgressBar, formatAudioTime } from "./audio-progress-bar";
import { AudioWaveform } from "./audio-waveform";

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

/** Left panel of the "Central de Áudio" — the currently spotlighted audio,
 * shown as a compact player (small cover, not a hero photograph) rather than
 * an image-first card, so this reads as a player and not a gallery tile. */
export function FeaturedAudioCard({ audio }: { audio: EndiamaAudio }) {
  const player = useAudioPlayer();
  const isActive = player.track?.id === audio.id;
  const isActivePlaying = isActive && player.isPlaying;
  const currentTime = isActive ? player.currentTime : 0;
  const duration = isActive ? player.duration || audio.durationSeconds : audio.durationSeconds;

  function handlePlay() {
    if (isActive) player.togglePlay();
    else player.play(toTrack(audio));
  }

  return (
    <div className="flex h-full flex-col">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-500 dark:text-gold-400">Áudio em Destaque</p>

      <div className="mt-4 flex flex-1 flex-col gap-5 sm:flex-row sm:items-start">
        <div className="relative mx-auto size-36 shrink-0 overflow-hidden rounded-2xl shadow-lg sm:mx-0 sm:size-44 lg:size-[200px]">
          <Image src={audio.coverImage} alt={audio.title} fill sizes="200px" className="object-cover" />
          <button
            type="button"
            aria-label={isActivePlaying ? "Pausar áudio" : "Reproduzir áudio"}
            onClick={handlePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 transition-opacity hover:opacity-100"
          >
            <span className="flex size-12 items-center justify-center rounded-full bg-white/95 text-brand-700">
              {isActivePlaying ? <HiOutlinePause className="size-5" /> : <HiOutlinePlay className="size-5 translate-x-0.5" />}
            </span>
          </button>
        </div>

        <div className="min-w-0 flex-1 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            {audio.category ? (
              <span className="rounded-full bg-brand-600/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-brand-700 dark:bg-white/10 dark:text-brand-300">
                {audio.category.name}
              </span>
            ) : null}
            <span className="flex items-center gap-1 text-[11px] text-foreground/45 dark:text-white/45">
              <HiOutlineCalendarDays className="size-3.5" />
              {formatDate(audio.publishedAt)}
            </span>
          </div>

          <h3 className="mt-2.5 font-heading text-xl font-medium leading-snug text-foreground dark:text-white sm:text-2xl">
            <Link href={`/audios/${audio.slug}`} className="transition-colors hover:text-brand-600 dark:hover:text-gold-300">
              {audio.title}
            </Link>
          </h3>
          {audio.description ? (
            <p className="mt-2 line-clamp-2 text-sm text-foreground/60 dark:text-white/55">{audio.description}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-6 flex items-center gap-4">
        <button
          type="button"
          aria-label={isActivePlaying ? "Pausar" : "Ouvir agora"}
          onClick={handlePlay}
          className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white shadow-md transition-transform hover:scale-105 dark:bg-gold-500 dark:text-brand-950"
        >
          {isActivePlaying ? <HiOutlinePause className="size-5" /> : <HiOutlinePlay className="size-5 translate-x-0.5" />}
        </button>

        <div className="min-w-0 flex-1">
          <AudioProgressBar
            currentTime={currentTime}
            duration={duration}
            onSeek={(t) => (isActive ? player.seek(t) : player.play(toTrack(audio)))}
            trackClassName="bg-foreground/10 dark:bg-white/15"
          />
          <div className="mt-1.5 flex items-center justify-between text-[11px] tabular-nums text-foreground/45 dark:text-white/45">
            <span>{formatAudioTime(currentTime)}</span>
            <span>{formatAudioTime(duration)}</span>
          </div>
        </div>

        <AudioWaveform active={isActivePlaying} className="hidden shrink-0 text-brand-600 dark:text-gold-400 sm:flex" />
      </div>
    </div>
  );
}
