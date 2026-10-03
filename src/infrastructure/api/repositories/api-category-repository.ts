import type { Category } from "@/domain/entities";
import type { CategoryRepository } from "@/domain/repositories";
import { apiGet } from "../http-client";
import type { CategoryDto } from "../dto";
import { mapCategory } from "../mappers";

/** locale is always an explicit parameter, never resolved internally via
 * next-intl/server — di.ts eagerly imports every repository into one module
 * that's reachable from client components (e.g. SearchModal), so a top-level
 * next-intl/server import anywhere in that graph would poison the client
 * bundle. Server Components pass `await getLocale()` explicitly. */
export class ApiCategoryRepository implements CategoryRepository {
  async getAll(locale = "pt"): Promise<Category[]> {
    const data = await apiGet<CategoryDto[]>(`/public/categories?locale=${locale}`);
    return data.map(mapCategory);
  }

  async getBySlug(slug: string, locale = "pt"): Promise<Category | null> {
    const all = await this.getAll(locale);
    return all.find((category) => category.slug === slug) ?? null;
  }
}
