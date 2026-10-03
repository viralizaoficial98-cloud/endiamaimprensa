"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

export interface AudioTrack {
  id: string;
  slug: string;
  title: string;
  coverImage: string;
  audioUrl: string;
  durationSeconds: number;
}

interface AudioPlayerState {
  track: AudioTrack | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
}

interface AudioPlayerContextValue extends AudioPlayerState {
  play: (track: AudioTrack) => void;
  togglePlay: () => void;
  pause: () => void;
  seek: (seconds: number) => void;
  skip: (deltaSeconds: number) => void;
  setVolume: (value: number) => void;
  toggleMute: () => void;
  close: () => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextValue | null>(null);

/**
 * One shared <audio> element for the whole app (mounted here, never in a
 * card) so starting a new track always pauses whatever was playing before —
 * no two audios can ever play at once, and playback survives client-side
 * navigation since this provider lives above <main> in the root layout.
 * `preload="none"` means nothing downloads until the visitor actually presses play.
 */
export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [track, setTrack] = useState<AudioTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("endiama_audio_volume");
      if (stored) setVolumeState(Math.min(1, Math.max(0, Number(stored))));
    } catch {
      // localStorage indisponível (modo privado, etc.) — mantém o volume por omissão.
    }
  }, []);

  const play = useCallback((next: AudioTrack) => {
    const el = audioRef.current;
    if (!el) return;

    setTrack((current) => {
      if (current?.id !== next.id) {
        el.src = next.audioUrl;
        setCurrentTime(0);
        setDuration(next.durationSeconds);
      }
      return next;
    });
    void el.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    const el = audioRef.current;
    if (!el || !track) return;
    if (isPlaying) {
      pause();
    } else {
      void el.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  }, [isPlaying, pause, track]);

  const seek = useCallback((seconds: number) => {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = seconds;
    setCurrentTime(seconds);
  }, []);

  const skip = useCallback(
    (deltaSeconds: number) => {
      const el = audioRef.current;
      if (!el) return;
      seek(Math.min(Math.max(el.currentTime + deltaSeconds, 0), el.duration || duration));
    },
    [duration, seek]
  );

  const setVolume = useCallback((value: number) => {
    const clamped = Math.min(1, Math.max(0, value));
    setVolumeState(clamped);
    setMuted(clamped === 0);
    if (audioRef.current) audioRef.current.volume = clamped;
    try {
      window.localStorage.setItem("endiama_audio_volume", String(clamped));
    } catch {
      // ignorar falhas de armazenamento
    }
  }, []);

  const toggleMute = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    const next = !muted;
    el.muted = next;
    setMuted(next);
  }, [muted]);

  const close = useCallback(() => {
    const el = audioRef.current;
    if (el) {
      el.pause();
      el.removeAttribute("src");
      el.load();
    }
    setTrack(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  const value = useMemo<AudioPlayerContextValue>(
    () => ({ track, isPlaying, currentTime, duration, volume, muted, play, togglePlay, pause, seek, skip, setVolume, toggleMute, close }),
    [track, isPlaying, currentTime, duration, volume, muted, play, togglePlay, pause, seek, skip, setVolume, toggleMute, close]
  );

  return (
    <AudioPlayerContext.Provider value={value}>
      {children}
      <audio
        ref={audioRef}
        preload="none"
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
        onDurationChange={(e) => {
          if (Number.isFinite(e.currentTarget.duration)) setDuration(e.currentTarget.duration);
        }}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        className="hidden"
      />
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer(): AudioPlayerContextValue {
  const ctx = useContext(AudioPlayerContext);
  if (!ctx) throw new Error("useAudioPlayer deve ser usado dentro de AudioPlayerProvider.");
  return ctx;
}
