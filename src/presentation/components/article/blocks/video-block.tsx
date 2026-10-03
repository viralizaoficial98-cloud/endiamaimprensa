"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useRef, useState } from "react";
import { HiPlay } from "react-icons/hi2";
import type { NewsBlock } from "@/domain/entities";
import { getEmbedSrc } from "@/lib/video-embed";

/** Video embedded inline in an article body. YOUTUBE/VIMEO render through the
 * allowlisted nocookie/player embed only (getEmbedSrc) — never arbitrary
 * iframe/HTML. UPLOAD/EXTERNAL render a plain <video> with native controls. */
export function VideoBlock({ block }: { block: NewsBlock }) {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  if (!block.videoUrl) return null;
  const embedSrc = getEmbedSrc(block.videoType, block.videoUrl);

  function handlePlay() {
    setPlaying(true);
    if (!embedSrc) requestAnimationFrame(() => videoRef.current?.play());
  }

  return (
    <figure>
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-xl">
        {embedSrc ? (
          playing ? (
            <iframe
              src={embedSrc}
              title={block.title || "Vídeo"}
              allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          ) : block.thumbnailUrl ? (
            <Image src={block.thumbnailUrl} alt={block.title || ""} fill sizes="(max-width: 768px) 100vw, 768px" className="object-cover" />
          ) : (
            <div className="h-full w-full bg-brand-950" />
          )
        ) : (
          <video
            ref={videoRef}
            src={block.videoUrl}
            controls={playing}
            poster={block.thumbnailUrl}
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
              <span className="flex size-16 items-center justify-center rounded-full bg-white/95 text-brand-700 shadow-2xl transition-transform duration-300 group-hover:scale-110">
                <HiPlay className="size-7 translate-x-1" />
              </span>
            </motion.button>
          ) : null}
        </AnimatePresence>
      </div>
      {block.title ? <figcaption className="mt-2.5 text-center text-sm text-foreground/50">{block.title}</figcaption> : null}
    </figure>
  );
}
