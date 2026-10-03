import type { News } from "@/domain/entities";
import type { NewsListParams } from "@/domain/repositories";
import type { Paginated } from "@/domain/shared/pagination";
import { repositories } from "@/infrastructure/di";

export function listNews(params?: NewsListParams, locale?: string): Promise<Paginated<News>> {
  return repositories.news.list(params, locale);
}

export function getLatestNews(limit?: number, excludeIds?: string[], locale?: string): Promise<News[]> {
  return repositories.news.getLatest(limit, excludeIds, locale);
}

export function getFeaturedNews(limit?: number, locale?: string): Promise<News[]> {
  return repositories.news.getFeatured(limit, locale);
}

export function getBreakingNews(limit?: number, locale?: string): Promise<News[]> {
  return repositories.news.getBreaking(limit, locale);
}

export function getMostReadNews(limit?: number, excludeIds?: string[], locale?: string): Promise<News[]> {
  return repositories.news.getMostRead(limit, excludeIds, locale);
}

export function getNewsByFormat(format: News["format"], limit?: number, excludeIds?: string[], locale?: string): Promise<News[]> {
  return repositories.news.getByFormat(format, limit, excludeIds, locale);
}

export function getNewsByCategory(categorySlug: string, limit?: number, locale?: string): Promise<News[]> {
  return repositories.news.getByCategory(categorySlug, limit, locale);
}

export function getNewsBySlug(slug: string, locale?: string): Promise<News | null> {
  return repositories.news.getBySlug(slug, locale);
}

export function getRelatedNews(newsId: string, limit?: number, locale?: string): Promise<News[]> {
  return repositories.news.getRelated(newsId, limit, locale);
}

export function getAdjacentNews(newsId: string, locale?: string) {
  return repositories.news.getAdjacent(newsId, locale);
}

export function searchNews(query: string, limit?: number, locale?: string): Promise<News[]> {
  return repositories.news.search(query, limit, locale);
}
