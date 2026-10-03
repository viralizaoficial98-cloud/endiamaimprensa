import type { Request } from "express";
import { prisma } from "../../config/prisma";
import { AppError } from "../../common/app-error";
import { localize, type Locale } from "../../common/locale";
import { ensureUniqueSlug } from "../../utils/slug";
import { recordAudit } from "../audit/audit.service";

export interface CategoryInput {
  name: string;
  nameEn?: string;
  description?: string;
  descriptionEn?: string;
  image?: string;
  icon?: string;
  color?: string;
  parentId?: string | null;
  order?: number;
  status?: "ACTIVE" | "INACTIVE";
}

const CATEGORY_FIELD_PAIRS: [string, string][] = [
  ["name", "nameEn"],
  ["description", "descriptionEn"],
];

export async function listCategories(includeInactive = false) {
  return prisma.category.findMany({
    where: includeInactive ? undefined : { status: "ACTIVE" },
    orderBy: { order: "asc" },
    include: { children: true },
  });
}

export async function listCategoriesPublic(locale: Locale, includeInactive = false) {
  const rows = await listCategories(includeInactive);
  return rows.map((category) => ({
    ...localize(category, locale, CATEGORY_FIELD_PAIRS),
    children: category.children.map((child) => localize(child, locale, CATEGORY_FIELD_PAIRS)),
  }));
}

export async function getCategoryBySlug(slug: string) {
  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) throw AppError.notFound("Categoria não encontrada.");
  return category;
}

export async function createCategory(input: CategoryInput, req?: Request) {
  const slug = await ensureUniqueSlug(input.name, async (candidate) => Boolean(await prisma.category.findUnique({ where: { slug: candidate } })));
  const category = await prisma.category.create({
    data: { ...input, slug, status: input.status ?? "ACTIVE" },
  });
  await recordAudit({ req, action: "CREATE", module: "categories", entity: "Category", entityId: category.id, newData: input });
  return category;
}

export async function updateCategory(id: string, input: Partial<CategoryInput>, req?: Request) {
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) throw AppError.notFound("Categoria não encontrada.");
  const category = await prisma.category.update({ where: { id }, data: input });
  await recordAudit({ req, action: "UPDATE", module: "categories", entity: "Category", entityId: id, oldData: existing, newData: input });
  return category;
}

export async function deleteCategory(id: string, req?: Request) {
  const newsCount = await prisma.news.count({ where: { categoryId: id, deletedAt: null } });
  if (newsCount > 0) throw AppError.conflict("Não é possível eliminar uma categoria com notícias associadas.");
  await prisma.category.delete({ where: { id } });
  await recordAudit({ req, action: "DELETE", module: "categories", entity: "Category", entityId: id });
}
