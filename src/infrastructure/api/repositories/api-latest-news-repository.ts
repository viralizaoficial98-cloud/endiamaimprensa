import type { LatestNewsSectionData } from "@/domain/entities";
import type { LatestNewsRepository } from "@/domain/repositories";
import { apiGet } from "../http-client";
import type { LatestNewsSectionDto } from "../dto";
import { mapLatestNewsSection } from "../mappers";

export class ApiLatestNewsRepository implements LatestNewsRepository {
  async getSection(locale = "pt"): Promise<LatestNewsSectionData> {
    const data = await apiGet<LatestNewsSectionDto>(`/public/latest-news?locale=${locale}`);
    return mapLatestNewsSection(data);
  }
}
