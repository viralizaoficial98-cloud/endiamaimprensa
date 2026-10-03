import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { asyncHandler } from "../../common/async-handler";
import { created, ok } from "../../common/api-response";
import { authenticate } from "../../guards/authenticate";
import { authorize } from "../../guards/authorize";
import { validate } from "../../middleware/validate";
import { ensureUniqueSlug } from "../../utils/slug";

const tagSchema = z.object({ name: z.string().min(2) });

export const tagsPublicRouter = Router();
tagsPublicRouter.get(
  "/",
  asyncHandler(async (_req, res) => ok(res, await prisma.tag.findMany({ orderBy: { name: "asc" } })))
);

export const tagsAdminRouter = Router();
tagsAdminRouter.use(authenticate, authorize("news.create", "news.update"));
tagsAdminRouter.post(
  "/",
  validate(tagSchema),
  asyncHandler(async (req, res) => {
    const slug = await ensureUniqueSlug(req.body.name, async (candidate) => Boolean(await prisma.tag.findUnique({ where: { slug: candidate } })));
    const tag = await prisma.tag.create({ data: { name: req.body.name, slug } });
    created(res, tag, "Tag criada com sucesso.");
  })
);
tagsAdminRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await prisma.tag.delete({ where: { id: req.params.id } });
    ok(res, null, "Tag removida com sucesso.");
  })
);
