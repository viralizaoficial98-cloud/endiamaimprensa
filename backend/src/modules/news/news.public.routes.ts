import { Router } from "express";
import {
  getAdjacentByIdHandler,
  getBreakingHandler,
  getByFormatHandler,
  getFeaturedHandler,
  getLatestHandler,
  getMostReadHandler,
  getNewsBySlugHandler,
  getRelatedByIdHandler,
  listNewsPublicHandler,
  searchNewsHandler,
} from "./news.controller";

export const newsPublicRouter = Router();

/**
 * @openapi
 * /public/news:
 *   get:
 *     tags: [Public]
 *     summary: Lista notícias publicadas (paginado, com filtros)
 *     responses:
 *       200: { description: Lista paginada de notícias publicadas }
 */
newsPublicRouter.get("/featured", getFeaturedHandler);
newsPublicRouter.get("/latest", getLatestHandler);
newsPublicRouter.get("/most-read", getMostReadHandler);
newsPublicRouter.get("/breaking", getBreakingHandler);
newsPublicRouter.get("/search", searchNewsHandler);
newsPublicRouter.get("/format/:format", getByFormatHandler);
newsPublicRouter.get("/by-id/:id/related", getRelatedByIdHandler);
newsPublicRouter.get("/by-id/:id/adjacent", getAdjacentByIdHandler);
newsPublicRouter.get("/:slug", getNewsBySlugHandler);
newsPublicRouter.get("/", listNewsPublicHandler);
