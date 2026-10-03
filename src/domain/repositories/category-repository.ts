import type { Category } from "../entities/category";

export interface CategoryRepository {
  getAll(locale?: string): Promise<Category[]>;
  getBySlug(slug: string, locale?: string): Promise<Category | null>;
}
