import type { EndiamaAudio } from "@/domain/entities";
import type { AudioListParams, AudioRepository } from "@/domain/repositories";
import type { Paginated } from "@/domain/shared/pagination";
import { apiGet, apiGetPaginated, buildQuery } from "../http-client";
import type { AudioDto } from "../dto";
import { mapAudio } from "../mappers";

export class ApiAudioRepository implements AudioRepository {
  async getHighlights(limit = 4): Promise<EndiamaAudio[]> {
    const { data } = await apiGetPaginated<AudioDto>(`/public/audios${buildQuery({ limit })}`);
    return data.map(mapAudio);
  }

  async list(params: AudioListParams = {}): Promise<Paginated<EndiamaAudio>> {
    const { data, pagination } = await apiGetPaginated<AudioDto>(
      `/public/audios${buildQuery({ page: params.page, limit: params.limit, search: params.search, category: params.category })}`
    );
    return { data: data.map(mapAudio), pagination };
  }

  async getBySlug(slug: string): Promise<EndiamaAudio | null> {
    try {
      const data = await apiGet<AudioDto>(`/public/audios/${slug}`);
      return mapAudio(data);
    } catch {
      return null;
    }
  }
}
