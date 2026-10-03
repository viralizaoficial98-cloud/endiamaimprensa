"use client";

import Image from "next/image";
import Link from "next/link";
import { HiOutlinePause, HiOutlinePlay } from "react-icons/hi2";
import type { EndiamaAudio } from "@/domain/entities";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import { RevealGroup, RevealItem } from "@/presentation/components/ui/reveal";
import { useAudioPlayer } from "@/presentation/providers/audio-player-provider";
import { AudioProgressBar, formatAudioTime } from "./audio-progress-bar";

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

/** Compact editorial list — the "Últimos Áudios" strip beneath the Central de
 * Áudio. Deliberately a list of rows, not a card grid, so Áudios keeps a
 * radio/rundown identity instead of doubling as another photo gallery. */
export function LatestAudiosList({ audios, className }: { audios: EndiamaAudio[]; className?: string }) {
  const player = useAudioPlayer();
  if (audios.length === 0) return null;

  return (
    <div className={cn("overflow-hidden rounded-2xl border border-border-subtle", className)}>
      <RevealGroup stagger={0.05}>
        {audios.map((audio, i) => {
          const isActive = player.track?.id === audio.id;
          const isActivePlaying = isActive && player.isPlaying;
          return (
            <RevealItem key={audio.id}>
              <div
                className={cn(
                  "group flex items-center gap-3 border-b border-border-subtle bg-surface px-3 py-3 transition-colors last:border-0 hover:bg-surface-muted sm:gap-4 sm:px-5",
                  isActive && "bg-brand-600/[0.04] dark:bg-gold-400/[0.05]"
                )}
              >
                <button
                  type="button"
                  aria-label={isActivePlaying ? "Pausar áudio" : "Reproduzir áudio"}
                  onClick={() => (isActive ? player.togglePlay() : player.play(toTrack(audio)))}
                  className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border-subtle text-foreground/60 transition-all hover:scale-105 hover:border-brand-500 hover:text-brand-600 dark:hover:border-gold-400 dark:hover:text-gold-400"
                >
                  {isActivePlaying ? <HiOutlinePause className="size-4" /> : <HiOutlinePlay className="size-4 translate-x-0.5" />}
                </button>

                <span className="hidden w-5 shrink-0 text-center text-xs font-semibold tabular-nums text-foreground/30 sm:block">
                  {String(i + 1).padStart(2, "0")}
                </span>

                <div className="relative size-12 shrink-0 overflow-hidden rounded-lg sm:size-14">
                  <Image src={audio.coverImage} alt={audio.title} fill sizes="56px" loading="lazy" className="object-cover" />
                </div>

                <Link href={`/audios/${audio.slug}`} className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-medium text-foreground transition-colors group-hover:text-brand-600 dark:group-hover:text-gold-300">
                    {audio.title}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-foreground/45">
                    {audio.category ? <span>{audio.category.name}</span> : null}
                    <span>•</span>
                    <span>{formatDate(audio.publishedAt)}</span>
                  </p>
                  {isActive ? (
                    <div className="mt-2 max-w-xs">
                      <AudioProgressBar currentTime={player.currentTime} duration={player.duration || audio.durationSeconds} onSeek={player.seek} />
                    </div>
                  ) : null}
                </Link>

                <span className="shrink-0 text-xs font-medium tabular-nums text-foreground/45">
                  {isActive ? `${formatAudioTime(player.currentTime)} / ${formatAudioTime(player.duration || audio.durationSeconds)}` : formatAudioTime(audio.durationSeconds)}
                </span>
              </div>
            </RevealItem>
          );
        })}
      </RevealGroup>
    </div>
  );
}
