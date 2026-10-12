import type { HistoricalNews } from "../entities/historical-news";
import type { Paginated } from "../shared/pagination";

export interface HistoricalNewsListParams {
  page?: number;
  limit?: number;
  search?: string;
  year?: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface HistoricalNewsRepository {
  list(params?: HistoricalNewsListParams): Promise<Paginated<HistoricalNews>>;
}
