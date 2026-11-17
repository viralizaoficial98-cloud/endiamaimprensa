import type { Category } from "./category";

export type VideoSourceType = "UPLOAD" | "YOUTUBE" | "VIMEO" | "EXTERNAL";

export interface Video {
  id: string;
  slug: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  /** UPLOAD/EXTERNAL: videoUrl is a direct playable file URL. YOUTUBE/VIMEO:
   * videoUrl holds just the video ID, used to build a safe embed URL. */
  videoType: VideoSourceType;
  durationSeconds: number;
  category: Category;
  publishedAt: string;
  /** Real publication date from the CMS (publishedAt above falls back to "now" for display). */
  datePublished?: string;
  updatedAt?: string;
  views: number;
}
