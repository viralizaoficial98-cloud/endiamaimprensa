import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { asyncHandler } from "../../common/async-handler";
import { created, ok, okPaginated } from "../../common/api-response";
import { parseListQuery } from "../../common/list-query";
import { authenticate } from "../../guards/authenticate";
import { authorize } from "../../guards/authorize";
import { validate } from "../../middleware/validate";
import { resolveLocale } from "../../common/locale";
import * as categoriesService from "./categories.service";
import { getByCategory as getNewsByCategory } from "../news/news.service";

const categorySchema = z.object({
  name: z.string().min(2),
  nameEn: z.string().optional(),
  description: z.string().optional(),
  descriptionEn: z.string().optional(),
  image: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  parentId: z.string().nullable().optional(),
  order: z.number().int().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export const categoriesPublicRouter = Router();
categoriesPublicRouter.get(
  "/",
  asyncHandler(async (req, res) => ok(res, await categoriesService.listCategoriesPublic(resolveLocale(req))))
);
categoriesPublicRouter.get(
  "/:slug/news",
  asyncHandler(async (req, res) => {
    const limit = Number(req.query.limit) || 12;
    ok(res, await getNewsByCategory(req.params.slug, limit, resolveLocale(req)));
  })
);

export const categoriesAdminRouter = Router();
categoriesAdminRouter.use(authenticate);

categoriesAdminRouter.get(
  "/",
  authorize("categories.manage", "news.read"),
  asyncHandler(async (req, res) => {
    const query = parseListQuery(req, "order");
    const all = await categoriesService.listCategories(true);
    const total = all.length;
    const paged = all.slice(query.skip, query.skip + query.limit);
    okPaginated(res, paged, { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) || 1, hasNextPage: query.skip + query.limit < total, hasPreviousPage: query.page > 1 });
  })
);
categoriesAdminRouter.post(
  "/",
  authorize("categories.manage"),
  validate(categorySchema),
  asyncHandler(async (req, res) => created(res, await categoriesService.createCategory(req.body, req), "Categoria criada com sucesso."))
);
categoriesAdminRouter.get(
  "/:id",
  authorize("categories.manage"),
  asyncHandler(async (req, res) => {
    const category = await prisma.category.findUnique({ where: { id: req.params.id } });
    ok(res, category);
  })
);
categoriesAdminRouter.patch(
  "/:id",
  authorize("categories.manage"),
  validate(categorySchema.partial()),
  asyncHandler(async (req, res) => ok(res, await categoriesService.updateCategory(req.params.id, req.body, req), "Categoria actualizada com sucesso."))
);
categoriesAdminRouter.delete(
  "/:id",
  authorize("categories.manage"),
  asyncHandler(async (req, res) => {
    await categoriesService.deleteCategory(req.params.id, req);
    ok(res, null, "Categoria removida com sucesso.");
  })
);
