"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

export function formatAudioTime(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return "0:00";
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

interface AudioProgressBarProps {
  currentTime: number;
  duration: number;
  onSeek: (seconds: number) => void;
  className?: string;
  trackClassName?: string;
  fillClassName?: string;
}

/** Click/drag-to-seek timeline — shared by the card, the detail-page player and the mini player. */
export function AudioProgressBar({ currentTime, duration, onSeek, className, trackClassName, fillClassName }: AudioProgressBarProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const progress = duration > 0 ? Math.min(currentTime / duration, 1) : 0;

  function seekFromEvent(clientX: number) {
    const bar = barRef.current;
    if (!bar || duration <= 0) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    onSeek(ratio * duration);
  }

  return (
    <div
      ref={barRef}
      role="slider"
      aria-label="Progresso do áudio"
      aria-valuemin={0}
      aria-valuemax={Math.round(duration)}
      aria-valuenow={Math.round(currentTime)}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") onSeek(Math.min(currentTime + 5, duration));
        if (e.key === "ArrowLeft") onSeek(Math.max(currentTime - 5, 0));
      }}
      onClick={(e) => seekFromEvent(e.clientX)}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        seekFromEvent(e.clientX);
      }}
      onPointerMove={(e) => {
        if (e.buttons === 1) seekFromEvent(e.clientX);
      }}
      className={cn("group/bar relative h-1.5 w-full cursor-pointer rounded-full", className)}
    >
      <div className={cn("absolute inset-0 rounded-full bg-foreground/15", trackClassName)} />
      <div
        style={{ width: `${progress * 100}%` }}
        className={cn("absolute inset-y-0 left-0 rounded-full bg-brand-600 transition-[width] duration-150", fillClassName)}
      />
      <div
        style={{ left: `${progress * 100}%` }}
        className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-600 opacity-0 shadow transition-opacity duration-150 group-hover/bar:opacity-100"
      />
    </div>
  );
}
