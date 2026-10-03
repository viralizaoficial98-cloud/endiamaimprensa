"use client";

import { useEffect, useRef, useState } from "react";
import { HiOutlinePause, HiOutlinePlay, HiOutlineSpeakerWave } from "react-icons/hi2";
import type { NewsBlock } from "@/domain/entities";

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Self-contained inline player — deliberately not wired into the site-wide
 * AudioPlayerProvider/MiniPlayer queue (that's for the standalone Audios
 * module and shouldn't take over playback just because an article scrolled
 * past an embedded clip). Play / progress / time / volume, as required. */
export function AudioBlock({ block }: { block: NewsBlock }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrent(audio.currentTime);
    const onMeta = () => setDuration(audio.duration || 0);
    const onEnd = () => setPlaying(false);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("ended", onEnd);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("ended", onEnd);
    };
  }, []);

  if (!block.audioUrl) return null;

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) audio.pause();
    else audio.play();
    setPlaying(!playing);
  }

  function seek(e: React.ChangeEvent<HTMLInputElement>) {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Number(e.target.value);
    setCurrent(audio.currentTime);
  }

  function setVolume(e: React.ChangeEvent<HTMLInputElement>) {
    if (audioRef.current) audioRef.current.volume = Number(e.target.value);
  }

  return (
    <div className="rounded-2xl border border-border-subtle bg-surface p-4 sm:p-5">
      <audio ref={audioRef} src={block.audioUrl} preload="metadata" />
      {block.title ? <p className="mb-3 text-sm font-medium text-foreground">{block.title}</p> : null}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={togglePlay}
          aria-label={playing ? "Pausar" : "Reproduzir"}
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white transition-colors hover:bg-brand-700"
        >
          {playing ? <HiOutlinePause className="size-4.5" /> : <HiOutlinePlay className="ml-0.5 size-4.5" />}
        </button>
        <span className="w-10 shrink-0 text-xs tabular-nums text-foreground/50">{formatTime(current)}</span>
        <input
          type="range"
          min={0}
          max={duration || 0}
          value={current}
          onChange={seek}
          className="h-1.5 flex-1 accent-brand-600"
        />
        <span className="w-10 shrink-0 text-xs tabular-nums text-foreground/50">{formatTime(duration)}</span>
        <HiOutlineSpeakerWave className="size-4 shrink-0 text-foreground/40" />
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          defaultValue={1}
          onChange={setVolume}
          className="h-1.5 w-16 shrink-0 accent-brand-600"
        />
      </div>
    </div>
  );
}
