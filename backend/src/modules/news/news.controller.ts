import type { Request, Response } from "express";
import { asyncHandler } from "../../common/async-handler";
import { created, ok, okPaginated } from "../../common/api-response";
import { AppError } from "../../common/app-error";
import { parseListQuery } from "../../common/list-query";
import { resolveLocale } from "../../common/locale";
import * as newsService from "./news.service";

export const listNewsAdminHandler = asyncHandler(async (req: Request, res: Response) => {
  const query = parseListQuery(req, "createdAt");
  const { data, pagination } = await newsService.listNews(query);
  okPaginated(res, data, pagination);
});

export const listNewsPublicHandler = asyncHandler(async (req: Request, res: Response) => {
  const query = parseListQuery(req, "publishedAt");
  const { data, pagination } = await newsService.listNews(query, { publicOnly: true, locale: resolveLocale(req) });
  okPaginated(res, data, pagination);
});

export const getNewsByIdHandler = asyncHandler(async (req: Request, res: Response) => {
  ok(res, await newsService.getNewsById(req.params.id));
});

export const getNewsBySlugHandler = asyncHandler(async (req: Request, res: Response) => {
  ok(res, await newsService.getNewsBySlugPublic(req.params.slug, req, resolveLocale(req)));
});

export const getFeaturedHandler = asyncHandler(async (req: Request, res: Response) => {
  ok(res, await newsService.getFeatured(Number(req.query.limit) || undefined, resolveLocale(req)));
});

function parseExcludeIds(req: Request): string[] {
  const raw = req.query.excludeIds;
  if (typeof raw !== "string" || !raw.trim()) return [];
  return raw.split(",").map((id) => id.trim()).filter(Boolean);
}

export const getLatestHandler = asyncHandler(async (req: Request, res: Response) => {
  ok(res, await newsService.getLatest(Number(req.query.limit) || undefined, parseExcludeIds(req), resolveLocale(req)));
});

export const getMostReadHandler = asyncHandler(async (req: Request, res: Response) => {
  ok(res, await newsService.getMostRead(Number(req.query.limit) || undefined, parseExcludeIds(req), resolveLocale(req)));
});

export const getBreakingHandler = asyncHandler(async (req: Request, res: Response) => {
  ok(res, await newsService.getBreaking(Number(req.query.limit) || undefined, resolveLocale(req)));
});

export const searchNewsHandler = asyncHandler(async (req: Request, res: Response) => {
  const q = String(req.query.q ?? req.query.search ?? "");
  ok(res, await newsService.searchNews(q, Number(req.query.limit) || undefined, resolveLocale(req)));
});

export const getByFormatHandler = asyncHandler(async (req: Request, res: Response) => {
  ok(res, await newsService.getByFormat(req.params.format, Number(req.query.limit) || undefined, parseExcludeIds(req), resolveLocale(req)));
});

export const getRelatedByIdHandler = asyncHandler(async (req: Request, res: Response) => {
  ok(res, await newsService.getRelated(req.params.id, Number(req.query.limit) || undefined, resolveLocale(req)));
});

export const getAdjacentByIdHandler = asyncHandler(async (req: Request, res: Response) => {
  ok(res, await newsService.getAdjacent(req.params.id, resolveLocale(req)));
});

export const createNewsHandler = asyncHandler(async (req: Request, res: Response) => {
  const news = await newsService.createNews(req.user!.id, req.body, req);
  created(res, news, "Notícia criada com sucesso.");
});

export const updateNewsHandler = asyncHandler(async (req: Request, res: Response) => {
  ok(res, await newsService.updateNews(req.params.id, req.body, req.user!.id, req), "Notícia actualizada com sucesso.");
});

export const deleteNewsHandler = asyncHandler(async (req: Request, res: Response) => {
  await newsService.deleteNews(req.params.id, req);
  ok(res, null, "Notícia removida com sucesso.");
});

export const duplicateNewsHandler = asyncHandler(async (req: Request, res: Response) => {
  const news = await newsService.duplicateNews(req.params.id, req.user!.id, req);
  created(res, news, "Notícia duplicada com sucesso.");
});

export const getVersionsHandler = asyncHandler(async (req: Request, res: Response) => {
  ok(res, await newsService.getNewsVersions(req.params.id));
});

export const submitReviewHandler = asyncHandler(async (req: Request, res: Response) => {
  ok(res, await newsService.submitForReview(req.params.id, req), "Notícia enviada para revisão.");
});

export const approveHandler = asyncHandler(async (req: Request, res: Response) => {
  ok(res, await newsService.approveNews(req.params.id, req.user!.id, req), "Notícia aprovada com sucesso.");
});

export const rejectHandler = asyncHandler(async (req: Request, res: Response) => {
  ok(res, await newsService.rejectNews(req.params.id, req.user!.id, req.body.reason, req), "Notícia rejeitada.");
});

export const publishHandler = asyncHandler(async (req: Request, res: Response) => {
  ok(res, await newsService.publishNews(req.params.id, req), "Notícia publicada com sucesso.");
});

export const unpublishHandler = asyncHandler(async (req: Request, res: Response) => {
  ok(res, await newsService.unpublishNews(req.params.id, req), "Notícia despublicada.");
});

export const archiveHandler = asyncHandler(async (req: Request, res: Response) => {
  ok(res, await newsService.archiveNews(req.params.id, req), "Notícia arquivada.");
});

export const scheduleHandler = asyncHandler(async (req: Request, res: Response) => {
  const scheduledAt = new Date(req.body.scheduledAt);
  if (scheduledAt.getTime() <= Date.now()) throw AppError.badRequest("A data de agendamento deve ser no futuro.");
  ok(res, await newsService.scheduleNews(req.params.id, scheduledAt, req), "Notícia agendada com sucesso.");
});
