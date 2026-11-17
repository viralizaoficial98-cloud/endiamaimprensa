import type { Category } from "./category";

export interface EndiamaAudio {
  id: string;
  slug: string;
  title: string;
  description: string;
  coverImage: string;
  audioUrl: string;
  durationSeconds: number;
  category: Category | null;
  interviewee?: string;
  location?: string;
  relatedEvent?: { id: string; title: string; slug: string };
  isFeatured: boolean;
  publishedAt: string;
  /** Real publication date from the CMS (publishedAt above falls back to "now" for display). */
  datePublished?: string;
  updatedAt?: string;
}
