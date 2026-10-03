import type { Video } from "@/domain/entities";
import { repositories } from "@/infrastructure/di";

export function getLatestVideos(limit?: number): Promise<Video[]> {
  return repositories.video.getLatest(limit);
}

export function getVideoBySlug(slug: string): Promise<Video | null> {
  return repositories.video.getBySlug(slug);
}

export function getAllVideos(): Promise<Video[]> {
  return repositories.video.getAll();
}
