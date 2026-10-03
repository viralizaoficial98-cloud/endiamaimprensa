"use client";

import { HiOutlineArrowUturnLeft, HiOutlineArrowUturnRight, HiOutlinePause, HiOutlinePlay, HiOutlineSpeakerWave, HiOutlineSpeakerXMark } from "react-icons/hi2";
import type { AudioTrack } from "@/presentation/providers/audio-player-provider";
import { useAudioPlayer } from "@/presentation/providers/audio-player-provider";
import { AudioProgressBar, formatAudioTime } from "./audio-progress-bar";

/** The full, reusable audio player — used on the /audios/:slug detail page.
 * Reads/writes the same shared global player as the cards and the mini
 * player, so pressing play here also drives the mini player everywhere else. */
export function AudioPlayer({ track }: { track: AudioTrack }) {
  const player = useAudioPlayer();
  const isActive = player.track?.id === track.id;
  const isActivePlaying = isActive && player.isPlaying;
  const currentTime = isActive ? player.currentTime : 0;
  const duration = isActive ? player.duration || track.durationSeconds : track.durationSeconds;

  return (
    <div className="rounded-2xl border border-border-subtle bg-surface p-5 sm:p-6">
      <div className="flex items-center gap-4">
        <button
          type="button"
          aria-label={isActivePlaying ? "Pausar" : "Reproduzir"}
          onClick={() => (isActive ? player.togglePlay() : player.play(track))}
          className="flex size-14 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white shadow-md transition-transform hover:scale-105"
        >
          {isActivePlaying ? <HiOutlinePause className="size-6" /> : <HiOutlinePlay className="size-6 translate-x-0.5" />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between text-xs tabular-nums text-foreground/50">
            <span>{formatAudioTime(currentTime)}</span>
            <span>{formatAudioTime(duration)}</span>
          </div>
          <AudioProgressBar
            currentTime={currentTime}
            duration={duration}
            onSeek={(t) => (isActive ? player.seek(t) : player.play(track))}
            className="mt-1.5"
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label="Recuar 10 segundos"
            onClick={() => (isActive ? player.skip(-10) : player.play(track))}
            className="inline-flex size-9 items-center justify-center rounded-full text-foreground/60 transition-colors hover:bg-foreground/5 hover:text-brand-600"
          >
            <HiOutlineArrowUturnLeft className="size-4.5" />
          </button>
          <button
            type="button"
            aria-label="Avançar 10 segundos"
            onClick={() => (isActive ? player.skip(10) : player.play(track))}
            className="inline-flex size-9 items-center justify-center rounded-full text-foreground/60 transition-colors hover:bg-foreground/5 hover:text-brand-600"
          >
            <HiOutlineArrowUturnRight className="size-4.5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={player.muted ? "Reactivar som" : "Silenciar"}
            onClick={player.toggleMute}
            className="inline-flex size-8 items-center justify-center rounded-full text-foreground/60 transition-colors hover:bg-foreground/5 hover:text-brand-600"
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
            className="w-24 accent-brand-600"
          />
        </div>
      </div>
    </div>
  );
}
