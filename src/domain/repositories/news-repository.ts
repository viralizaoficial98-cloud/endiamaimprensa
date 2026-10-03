import type { News } from "../entities/news";
import type { Paginated } from "../shared/pagination";

export type NewsSortBy = "publishedAt" | "viewsCount";

export interface NewsListParams {
  page?: number;
  limit?: number;
  category?: string;
  sortBy?: NewsSortBy;
  sortOrder?: "asc" | "desc";
  isFeatured?: boolean;
  isBreaking?: boolean;
  excludeIds?: string[];
}

export interface NewsRepository {
  list(params?: NewsListParams, locale?: string): Promise<Paginated<News>>;
  getLatest(limit?: number, excludeIds?: string[], locale?: string): Promise<News[]>;
  getFeatured(limit?: number, locale?: string): Promise<News[]>;
  getBreaking(limit?: number, locale?: string): Promise<News[]>;
  getMostRead(limit?: number, excludeIds?: string[], locale?: string): Promise<News[]>;
  getByFormat(format: News["format"], limit?: number, excludeIds?: string[], locale?: string): Promise<News[]>;
  getByCategory(categorySlug: string, limit?: number, locale?: string): Promise<News[]>;
  getBySlug(slug: string, locale?: string): Promise<News | null>;
  getRelated(newsId: string, limit?: number, locale?: string): Promise<News[]>;
  getAdjacent(newsId: string, locale?: string): Promise<{ previous: News | null; next: News | null }>;
  search(query: string, limit?: number, locale?: string): Promise<News[]>;
}
