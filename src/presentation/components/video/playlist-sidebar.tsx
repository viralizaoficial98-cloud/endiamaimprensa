"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { HiPlay } from "react-icons/hi2";
import type { Video } from "@/domain/entities";
import { formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";

export function PlaylistSidebar({
  videos,
  activeId,
  onSelect,
}: {
  videos: Video[];
  activeId: string;
  onSelect: (video: Video) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="mb-2 font-heading text-sm font-semibold uppercase tracking-wide text-foreground/50">
        Lista de Reprodução
      </h2>
      {videos.map((video) => {
        const active = video.id === activeId;
        return (
          <motion.button
            key={video.id}
            type="button"
            onClick={() => onSelect(video)}
            whileHover={{ x: 2 }}
            className={cn(
              "group flex items-center gap-3 rounded-xl p-2 text-left transition-colors",
              active ? "bg-brand-600/10" : "hover:bg-surface-muted"
            )}
          >
            <span className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-lg">
              <Image src={video.thumbnailUrl} alt={video.title} fill sizes="112px" className="object-cover" />
              <span
                className={cn(
                  "absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100",
                  active && "opacity-100 bg-black/40"
                )}
              >
                <HiPlay className="size-5 text-white" />
              </span>
              <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white">
                {formatDuration(video.durationSeconds)}
              </span>
            </span>
            <span className="min-w-0">
              <span
                className={cn(
                  "line-clamp-2 font-heading text-sm font-medium",
                  active ? "text-brand-600 dark:text-brand-400" : "text-foreground"
                )}
              >
                {video.title}
              </span>
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
