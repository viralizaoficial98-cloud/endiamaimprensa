import type { LatestNewsSectionData } from "@/domain/entities";
import { repositories } from "@/infrastructure/di";

export function getLatestNewsSection(locale?: string): Promise<LatestNewsSectionData> {
  return repositories.latestNews.getSection(locale);
}
