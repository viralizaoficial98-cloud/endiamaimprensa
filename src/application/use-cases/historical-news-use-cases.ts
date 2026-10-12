import type { HistoricalNews } from "@/domain/entities";
import type { HistoricalNewsListParams } from "@/domain/repositories";
import type { Paginated } from "@/domain/shared/pagination";
import { repositories } from "@/infrastructure/di";

export function listHistoricalNews(params?: HistoricalNewsListParams): Promise<Paginated<HistoricalNews>> {
  return repositories.historicalNews.list(params);
}
