import type { Video } from "@/domain/entities";
import type { VideoRepository } from "@/domain/repositories";
import { apiGet } from "../http-client";
import type { VideoDto } from "../dto";
import { mapVideo } from "../mappers";

export class ApiVideoRepository implements VideoRepository {
  private async getAllDtos(): Promise<VideoDto[]> {
    return apiGet<VideoDto[]>("/public/videos");
  }

  async getLatest(limit = 8): Promise<Video[]> {
    const all = await this.getAllDtos();
    return all.slice(0, limit).map(mapVideo);
  }

  async getBySlug(slug: string): Promise<Video | null> {
    try {
      const data = await apiGet<VideoDto>(`/public/videos/${slug}`);
      return mapVideo(data);
    } catch {
      return null;
    }
  }

  async getAll(): Promise<Video[]> {
    const all = await this.getAllDtos();
    return all.map(mapVideo);
  }
}
