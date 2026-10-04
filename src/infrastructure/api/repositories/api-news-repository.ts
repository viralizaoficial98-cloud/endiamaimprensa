import type { News } from "@/domain/entities";
import type { NewsListParams, NewsRepository } from "@/domain/repositories";
import type { Paginated } from "@/domain/shared/pagination";
import { apiGet, apiGetPaginated, buildQuery } from "../http-client";
import type { NewsDto } from "../dto";
import { mapNews } from "../mappers";

/** locale is always an explicit parameter here — never resolved internally via
 * next-intl/server — because this file is reachable from a "use client"
 * component (SearchModal) through di.ts. A top-level next-intl/server import
 * anywhere in that chain poisons the client bundle (next/headers cannot be
 * bundled for the browser). Server Components pass `await getLocale()`
 * (next-intl/server); SearchModal passes `useLocale()` (next-intl, client-safe). */
export class ApiNewsRepository implements NewsRepository {
  async list(params: NewsListParams = {}, locale = "pt"): Promise<Paginated<News>> {
    const { data, pagination } = await apiGetPaginated<NewsDto>(
      `/public/news${buildQuery({
        page: params.page,
        limit: params.limit,
        category: params.category,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
        isFeatured: params.isFeatured,
        isBreaking: params.isBreaking,
        excludeIds: params.excludeIds?.length ? params.excludeIds.join(",") : undefined,
        locale,
      })}`
    );
    return { data: data.map(mapNews), pagination };
  }

  async getLatest(limit = 12, excludeIds: string[] = [], locale = "pt"): Promise<News[]> {
    const data = await apiGet<NewsDto[]>(`/public/news/latest${buildQuery({ limit, excludeIds: excludeIds.length ? excludeIds.join(",") : undefined, locale })}`);
    return data.map(mapNews);
  }

  async getFeatured(limit = 6, locale = "pt"): Promise<News[]> {
    const data = await apiGet<NewsDto[]>(`/public/news/featured${buildQuery({ limit, locale })}`);
    return data.map(mapNews);
  }

  async getBreaking(limit = 6, locale = "pt"): Promise<News[]> {
    const data = await apiGet<NewsDto[]>(`/public/news/breaking${buildQuery({ limit, locale })}`);
    return data.map(mapNews);
  }

  async getMostRead(limit = 8, excludeIds: string[] = [], locale = "pt"): Promise<News[]> {
    const data = await apiGet<NewsDto[]>(`/public/news/most-read${buildQuery({ limit, excludeIds: excludeIds.length ? excludeIds.join(",") : undefined, locale })}`);
    return data.map(mapNews);
  }

  async getByFormat(format: News["format"], limit = 8, excludeIds: string[] = [], locale = "pt"): Promise<News[]> {
    const data = await apiGet<NewsDto[]>(`/public/news/format/${format}${buildQuery({ limit, excludeIds: excludeIds.length ? excludeIds.join(",") : undefined, locale })}`);
    return data.map(mapNews);
  }

  async getByCategory(categorySlug: string, limit = 8, locale = "pt"): Promise<News[]> {
    // deriveCacheTag() in http-client.ts would tag this "categories" (the
    // segment right after "public"), not "news" — so publishing/editing a
    // news article alone would never invalidate this listing. Overriding the
    // tags here covers both: a news mutation OR a category mutation
    // correctly refreshes it.
    const data = await apiGet<NewsDto[]>(`/public/categories/${categorySlug}/news${buildQuery({ limit, locale })}`, {
      next: { tags: ["news", "categories"] },
    });
    return data.map(mapNews);
  }

  async getBySlug(slug: string, locale = "pt"): Promise<News | null> {
    try {
      const data = await apiGet<NewsDto>(`/public/news/${slug}${buildQuery({ locale })}`);
      return mapNews(data);
    } catch {
      return null;
    }
  }

  async getRelated(newsId: string, limit = 4, locale = "pt"): Promise<News[]> {
    const data = await apiGet<NewsDto[]>(`/public/news/by-id/${newsId}/related${buildQuery({ limit, locale })}`);
    return data.map(mapNews);
  }

  async getAdjacent(newsId: string, locale = "pt"): Promise<{ previous: News | null; next: News | null }> {
    const data = await apiGet<{ previous: NewsDto | null; next: NewsDto | null }>(`/public/news/by-id/${newsId}/adjacent${buildQuery({ locale })}`);
    return { previous: data.previous ? mapNews(data.previous) : null, next: data.next ? mapNews(data.next) : null };
  }

  async search(query: string, limit = 10, locale = "pt"): Promise<News[]> {
    const data = await apiGet<NewsDto[]>(`/public/news/search${buildQuery({ q: query, limit, locale })}`);
    return data.map(mapNews);
  }
}
