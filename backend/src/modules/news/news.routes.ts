import { Router } from "express";
import { authenticate } from "../../guards/authenticate";
import { authorize } from "../../guards/authorize";
import { validate } from "../../middleware/validate";
import {
  approveHandler,
  archiveHandler,
  createNewsHandler,
  deleteNewsHandler,
  duplicateNewsHandler,
  getNewsByIdHandler,
  listNewsAdminHandler,
  publishHandler,
  rejectHandler,
  scheduleHandler,
  submitReviewHandler,
  unpublishHandler,
  updateNewsHandler,
  getVersionsHandler,
} from "./news.controller";
import { createNewsSchema, rejectNewsSchema, scheduleNewsSchema, updateNewsSchema } from "./news.validators";

export const newsAdminRouter = Router();
newsAdminRouter.use(authenticate);

/**
 * @openapi
 * /admin/news:
 *   get:
 *     tags: [News]
 *     summary: Lista notícias (admin, todos os estados)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *     responses:
 *       200: { description: Lista paginada de notícias }
 *   post:
 *     tags: [News]
 *     summary: Cria uma notícia em rascunho
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Notícia criada }
 */
newsAdminRouter.get("/", authorize("news.read"), listNewsAdminHandler);
newsAdminRouter.post("/", authorize("news.create"), validate(createNewsSchema), createNewsHandler);
newsAdminRouter.get("/:id", authorize("news.read"), getNewsByIdHandler);
newsAdminRouter.patch("/:id", authorize("news.update"), validate(updateNewsSchema), updateNewsHandler);
newsAdminRouter.delete("/:id", authorize("news.delete"), deleteNewsHandler);
newsAdminRouter.get("/:id/versions", authorize("news.read"), getVersionsHandler);
newsAdminRouter.post("/:id/duplicate", authorize("news.create"), duplicateNewsHandler);

newsAdminRouter.post("/:id/submit-review", authorize("news.update", "news.create"), submitReviewHandler);
newsAdminRouter.post("/:id/approve", authorize("news.approve"), approveHandler);
newsAdminRouter.post("/:id/reject", authorize("news.approve"), validate(rejectNewsSchema), rejectHandler);
newsAdminRouter.post("/:id/publish", authorize("news.publish"), publishHandler);
newsAdminRouter.post("/:id/unpublish", authorize("news.publish"), unpublishHandler);
newsAdminRouter.post("/:id/archive", authorize("news.update", "news.publish"), archiveHandler);
newsAdminRouter.post("/:id/schedule", authorize("news.schedule"), validate(scheduleNewsSchema), scheduleHandler);
