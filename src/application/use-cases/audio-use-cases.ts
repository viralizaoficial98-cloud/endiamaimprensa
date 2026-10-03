import type { EndiamaAudio } from "@/domain/entities";
import type { AudioListParams } from "@/domain/repositories";
import type { Paginated } from "@/domain/shared/pagination";
import { repositories } from "@/infrastructure/di";

export function getAudioHighlights(limit?: number): Promise<EndiamaAudio[]> {
  return repositories.audio.getHighlights(limit);
}

export function listAudios(params?: AudioListParams): Promise<Paginated<EndiamaAudio>> {
  return repositories.audio.list(params);
}

export function getAudioBySlug(slug: string): Promise<EndiamaAudio | null> {
  return repositories.audio.getBySlug(slug);
}
