"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { HiOutlinePause, HiOutlinePlay, HiOutlineSpeakerWave, HiOutlineSpeakerXMark } from "react-icons/hi2";
import type { EndiamaAudio } from "@/domain/entities";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { fadeUp } from "@/presentation/animations/variants";
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

/** Grid card used on /audios and in secondary highlight slots on the homepage. */
export function AudioCard({ audio }: { audio: EndiamaAudio }) {
  const player = useAudioPlayer();
  const isActive = player.track?.id === audio.id;
  const isActivePlaying = isActive && player.isPlaying;

  return (
    <motion.article
      variants={fadeUp}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border bg-surface transition-all hover:-translate-y-1 hover:shadow-lg",
        isActive ? "border-brand-500/60" : "border-border-subtle"
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={audio.coverImage}
          alt={audio.title}
          fill
          sizes="(max-width: 768px) 90vw, (max-width: 1024px) 45vw, 22vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        />
        <div className="absolute inset-0 bg-black/15 transition-colors group-hover:bg-black/30" />
        {audio.category ? (
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-brand-700">
            {audio.category.name}
          </span>
        ) : null}

        <Link href={`/audios/${audio.slug}`} className="absolute inset-0 z-10" aria-label={`Abrir detalhes: ${audio.title}`} />

        <button
          type="button"
          aria-label={isActivePlaying ? "Pausar áudio" : "Reproduzir áudio"}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (isActive) player.togglePlay();
            else player.play(toTrack(audio));
          }}
          className="absolute inset-0 z-20 flex items-center justify-center"
        >
          <span
            className={cn(
              "flex size-13 items-center justify-center rounded-full bg-white/90 text-brand-700 shadow-lg transition-transform duration-300 group-hover:scale-110",
              isActivePlaying && "scale-105"
            )}
          >
            {isActivePlaying ? <HiOutlinePause className="size-5.5" /> : <HiOutlinePlay className="size-5.5 translate-x-0.5" />}
          </span>
        </button>

        <span className="absolute bottom-3 right-3 z-10 rounded-md bg-black/70 px-2 py-1 text-xs font-medium text-white">
          {isActive ? formatAudioTime(player.duration || audio.durationSeconds) : formatAudioTime(audio.durationSeconds)}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 font-heading text-sm font-medium leading-snug text-foreground transition-colors group-hover:text-brand-700 dark:group-hover:text-brand-400">
          <Link href={`/audios/${audio.slug}`} className="relative z-20">
            {audio.title}
          </Link>
        </h3>
        {audio.description ? <p className="mt-1.5 line-clamp-2 text-xs text-foreground/55">{audio.description}</p> : null}
        <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-foreground/40">{formatDate(audio.publishedAt)}</p>

        <div className="relative z-20 mt-3 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <AudioProgressBar
            currentTime={isActive ? player.currentTime : 0}
            duration={isActive ? player.duration || audio.durationSeconds : audio.durationSeconds}
            onSeek={(t) => {
              if (isActive) player.seek(t);
              else player.play(toTrack(audio));
            }}
            className="flex-1"
          />
          {isActive ? (
            <button
              type="button"
              aria-label={player.muted ? "Reactivar som" : "Silenciar"}
              onClick={() => player.toggleMute()}
              className="shrink-0 text-foreground/50 transition-colors hover:text-brand-600"
            >
              {player.muted ? <HiOutlineSpeakerXMark className="size-4" /> : <HiOutlineSpeakerWave className="size-4" />}
            </button>
          ) : null}
        </div>
        {isActive ? (
          <p className="mt-1.5 text-[11px] tabular-nums text-foreground/40">
            {formatAudioTime(player.currentTime)} / {formatAudioTime(player.duration || audio.durationSeconds)}
          </p>
        ) : null}
      </div>
    </motion.article>
  );
}
