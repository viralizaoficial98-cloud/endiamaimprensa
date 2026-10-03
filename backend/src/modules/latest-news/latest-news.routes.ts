import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../common/async-handler";
import { ok } from "../../common/api-response";
import { authenticate } from "../../guards/authenticate";
import { authorize } from "../../guards/authorize";
import { validate } from "../../middleware/validate";
import { resolveLocale } from "../../common/locale";
import * as service from "./latest-news.service";
import { reorderItemsSchema, setItemsSchema, toggleItemSchema, updateConfigSchema } from "./latest-news.validators";

export const latestNewsPublicRouter = Router();

/**
 * @openapi
 * /public/latest-news:
 *   get:
 *     tags: [Public]
 *     summary: Devolve a configuração publicada da secção "Últimas Notícias" da homepage
 *     responses:
 *       200: { description: Configuração publicada (ou uma selecção de recuo segura, se nada tiver sido publicado ainda) }
 */
latestNewsPublicRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    ok(res, await service.getPublicLatestNews(resolveLocale(req)));
  })
);

export const latestNewsAdminRouter = Router();
latestNewsAdminRouter.use(authenticate, authorize("latestnews.manage"));

latestNewsAdminRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    ok(res, await service.getAdminConfig());
  })
);

latestNewsAdminRouter.patch(
  "/",
  validate(updateConfigSchema),
  asyncHandler(async (req, res) => {
    await service.updateConfigSettings(req.body, req.user!.id, req);
    ok(res, await service.getAdminConfig(), "Configuração guardada com sucesso.");
  })
);

latestNewsAdminRouter.put(
  "/items",
  validate(setItemsSchema),
  asyncHandler(async (req, res) => {
    ok(res, await service.setItems(req.body.items, req.user!.id, req), "Selecção actualizada com sucesso.");
  })
);

latestNewsAdminRouter.patch(
  "/items/:id",
  validate(toggleItemSchema.partial().extend({ sortOrder: z.number().int().min(0).optional() })),
  asyncHandler(async (req, res) => {
    await service.updateItem(req.params.id, req.body, req.user!.id, req);
    ok(res, await service.getAdminConfig(), "Item actualizado com sucesso.");
  })
);

latestNewsAdminRouter.delete(
  "/items/:id",
  asyncHandler(async (req, res) => {
    await service.deleteItem(req.params.id, req.user!.id, req);
    ok(res, await service.getAdminConfig(), "Item removido com sucesso.");
  })
);

latestNewsAdminRouter.post(
  "/items/reorder",
  validate(reorderItemsSchema),
  asyncHandler(async (req, res) => {
    await service.reorderItems(req.body.order, req.user!.id, req);
    ok(res, await service.getAdminConfig(), "Ordem actualizada com sucesso.");
  })
);

latestNewsAdminRouter.post(
  "/publish",
  asyncHandler(async (req, res) => {
    ok(res, await service.publish(req.user!.id, req), "Últimas Notícias publicadas com sucesso.");
  })
);
