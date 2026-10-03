import type { Video } from "../entities/video";

export interface VideoRepository {
  getLatest(limit?: number): Promise<Video[]>;
  getBySlug(slug: string): Promise<Video | null>;
  getAll(): Promise<Video[]>;
}
