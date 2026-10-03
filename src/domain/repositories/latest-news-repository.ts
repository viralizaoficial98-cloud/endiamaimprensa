import type { LatestNewsSectionData } from "../entities/latest-news";

export interface LatestNewsRepository {
  getSection(locale?: string): Promise<LatestNewsSectionData>;
}
