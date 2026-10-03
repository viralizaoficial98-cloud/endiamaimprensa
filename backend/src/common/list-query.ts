import type { Request } from "express";

export interface ListQuery {
  page: number;
  limit: number;
  skip: number;
  search?: string;
  status?: string;
  category?: string;
  author?: string;
  dateFrom?: Date;
  dateTo?: Date;
  sortBy: string;
  sortOrder: "asc" | "desc";
  isFeatured?: boolean;
  isBreaking?: boolean;
  excludeIds?: string[];
}

function parseBoolean(value: unknown): boolean | undefined {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

function parseDate(value: unknown): Date | undefined {
  if (typeof value !== "string" || !value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function parseListQuery(req: Request, defaultSortBy = "createdAt"): ListQuery {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));

  return {
    page,
    limit,
    skip: (page - 1) * limit,
    search: typeof req.query.search === "string" && req.query.search.trim() ? req.query.search.trim() : undefined,
    status: typeof req.query.status === "string" ? req.query.status : undefined,
    category: typeof req.query.category === "string" ? req.query.category : undefined,
    author: typeof req.query.author === "string" ? req.query.author : undefined,
    dateFrom: parseDate(req.query.dateFrom),
    dateTo: parseDate(req.query.dateTo),
    sortBy: typeof req.query.sortBy === "string" ? req.query.sortBy : defaultSortBy,
    sortOrder: req.query.sortOrder === "asc" ? "asc" : "desc",
    isFeatured: parseBoolean(req.query.isFeatured),
    isBreaking: parseBoolean(req.query.isBreaking),
    excludeIds:
      typeof req.query.excludeIds === "string" && req.query.excludeIds.trim()
        ? req.query.excludeIds.split(",").map((id) => id.trim()).filter(Boolean)
        : undefined,
  };
}
