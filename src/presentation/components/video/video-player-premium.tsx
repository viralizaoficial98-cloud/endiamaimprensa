"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useRef, useState } from "react";
import { HiPlay } from "react-icons/hi2";
import type { Video } from "@/domain/entities";
import { formatCompactNumber, formatDate, formatDuration } from "@/lib/format";

const EMBED_SRC: Partial<Record<Video["videoType"], (id: string) => string>> = {
  YOUTUBE: (id) => `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`,
  VIMEO: (id) => `https://player.vimeo.com/video/${id}?autoplay=1`,
};

export function VideoPlayerPremium({ video }: { video: Video }) {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const embedSrc = EMBED_SRC[video.videoType]?.(video.videoUrl);

  function handlePlay() {
    setPlaying(true);
    if (!embedSrc) requestAnimationFrame(() => videoRef.current?.play());
  }

  return (
    <div>
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-xl">
        {embedSrc ? (
          playing ? (
            <iframe
              key={video.id}
              src={embedSrc}
              title={video.title}
              allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          ) : (
            <Image src={video.thumbnailUrl} alt={video.title} fill sizes="(max-width: 1024px) 100vw, 66vw" className="object-cover" priority />
          )
        ) : (
          <video
            ref={videoRef}
            key={video.id}
            src={video.videoUrl}
            controls={playing}
            poster={video.thumbnailUrl}
            className="h-full w-full object-cover"
            onPause={() => setPlaying(false)}
          />
        )}
        <AnimatePresence>
          {!playing ? (
            <motion.button
              type="button"
              exit={{ opacity: 0 }}
              onClick={handlePlay}
              aria-label="Reproduzir vídeo"
              className="group absolute inset-0 flex items-center justify-center bg-black/30"
            >
              <span className="flex size-20 items-center justify-center rounded-full bg-white/95 text-brand-700 shadow-2xl transition-transform duration-300 group-hover:scale-110">
                <HiPlay className="size-9 translate-x-1" />
              </span>
              <span className="absolute bottom-5 right-5 rounded-md bg-black/70 px-2.5 py-1 text-xs font-medium text-white">
                {formatDuration(video.durationSeconds)}
              </span>
            </motion.button>
          ) : null}
        </AnimatePresence>
      </div>

      <div className="mt-6 flex items-start gap-4">
        <div className="relative size-12 shrink-0 overflow-hidden rounded-full">
          <Image src="/images/logotipo_endiama.png" alt="ENDIAMA" fill sizes="48px" className="scale-150 object-contain" />
        </div>
        <div>
          <h1 className="font-heading text-xl font-medium text-foreground sm:text-2xl">{video.title}</h1>
          <p className="mt-1 text-sm text-foreground/50">
            {formatCompactNumber(video.views)} visualizações · {formatDate(video.publishedAt)}
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-foreground/70">{video.description}</p>
        </div>
      </div>
    </div>
  );
}
