import type { Category } from "@/domain/entities";
import { repositories } from "@/infrastructure/di";

export function getAllCategories(locale?: string): Promise<Category[]> {
  return repositories.category.getAll(locale);
}

export function getCategoryBySlug(slug: string, locale?: string): Promise<Category | null> {
  return repositories.category.getBySlug(slug, locale);
}
