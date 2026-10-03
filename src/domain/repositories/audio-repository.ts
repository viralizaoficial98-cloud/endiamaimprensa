import type { EndiamaAudio } from "../entities/audio";
import type { Paginated } from "../shared/pagination";

export interface AudioListParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
}

export interface AudioRepository {
  /** Latest published audios for the homepage "Áudios em Destaque" section
   * (not strictly `isFeatured` — the section picks a hero from within these,
   * falling back to the most recent one, same pattern as Events). */
  getHighlights(limit?: number): Promise<EndiamaAudio[]>;
  list(params?: AudioListParams): Promise<Paginated<EndiamaAudio>>;
  getBySlug(slug: string): Promise<EndiamaAudio | null>;
}
