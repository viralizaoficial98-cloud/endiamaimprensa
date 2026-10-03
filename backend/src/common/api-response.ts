import type { Response } from "express";

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export function ok<T>(res: Response, data: T, message = "Operação realizada com sucesso.", status = 200) {
  return res.status(status).json({ success: true, message, data });
}

export function okPaginated<T>(
  res: Response,
  data: T[],
  pagination: PaginationMeta,
  message = "Operação realizada com sucesso."
) {
  return res.status(200).json({ success: true, message, data, pagination });
}

export function created<T>(res: Response, data: T, message = "Recurso criado com sucesso.") {
  return ok(res, data, message, 201);
}

export function noContent(res: Response, message = "Operação realizada com sucesso.") {
  return res.status(200).json({ success: true, message, data: null });
}

export function buildPagination(page: number, limit: number, total: number): PaginationMeta {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}
