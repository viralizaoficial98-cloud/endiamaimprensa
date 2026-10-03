import type { NewsVideoSourceType } from "@/domain/entities";

/** Allowlisted embed providers only — never render arbitrary iframe/HTML a
 * user or admin could supply. YOUTUBE/VIMEO store just the video id (never a
 * full attacker-controlled URL), so the embed src below is always shaped by
 * us, not by input. */
const EMBED_SRC: Partial<Record<NewsVideoSourceType, (id: string) => string>> = {
  YOUTUBE: (id) => `https://www.youtube-nocookie.com/embed/${id}?rel=0`,
  VIMEO: (id) => `https://player.vimeo.com/video/${id}`,
};

export function getEmbedSrc(videoType: NewsVideoSourceType | undefined, videoUrl: string | undefined): string | null {
  if (!videoType || !videoUrl) return null;
  return EMBED_SRC[videoType]?.(videoUrl) ?? null;
}
