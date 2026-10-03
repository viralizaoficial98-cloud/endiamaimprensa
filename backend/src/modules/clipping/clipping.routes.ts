import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { asyncHandler } from "../../common/async-handler";
import { created, ok, okPaginated, buildPagination } from "../../common/api-response";
import { parseListQuery } from "../../common/list-query";
import { authenticate } from "../../guards/authenticate";
import { authorize } from "../../guards/authorize";
import { validate } from "../../middleware/validate";
import { recordAudit } from "../audit/audit.service";

const MEDIA_TYPES = ["IMPRENSA_ESCRITA", "TELEVISAO", "RADIO", "PORTAL_DIGITAL", "PUBLICACAO_ONLINE"] as const;

const clippingSchema = z.object({
  title: z.string().min(2),
  source: z.string().min(1),
  clippingDate: z.string().datetime(),
  mediaType: z.enum(MEDIA_TYPES).optional(),
  categoryId: z.string().optional(),
  description: z.string().optional(),
  url: z.string().optional(),
  documentUrl: z.string().optional(),
  imageUrl: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
});

const include = { category: true };

export const clippingPublicRouter = Router();
clippingPublicRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const query = parseListQuery(req, "clippingDate");
    const where = {
      status: "PUBLISHED" as const,
      ...(query.search ? { title: { contains: query.search } } : {}),
      ...(query.category ? { category: { slug: query.category } } : {}),
      ...(typeof req.query.mediaType === "string" && MEDIA_TYPES.includes(req.query.mediaType as (typeof MEDIA_TYPES)[number])
        ? { mediaType: req.query.mediaType as (typeof MEDIA_TYPES)[number] }
        : {}),
      ...(query.dateFrom || query.dateTo
        ? { clippingDate: { ...(query.dateFrom ? { gte: query.dateFrom } : {}), ...(query.dateTo ? { lte: query.dateTo } : {}) } }
        : {}),
    };

    const [data, total] = await Promise.all([
      prisma.clipping.findMany({ where, include, orderBy: { [query.sortBy]: query.sortOrder }, skip: query.skip, take: query.limit }),
      prisma.clipping.count({ where }),
    ]);

    okPaginated(res, data, buildPagination(query.page, query.limit, total));
  })
);

export const clippingAdminRouter = Router();
clippingAdminRouter.use(authenticate, authorize("clipping.manage"));

clippingAdminRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const query = parseListQuery(req, "clippingDate");
    const where = {
      ...(query.search ? { title: { contains: query.search } } : {}),
      ...(query.status ? { status: query.status as "DRAFT" | "PUBLISHED" | "ARCHIVED" } : {}),
    };
    const [data, total] = await Promise.all([
      prisma.clipping.findMany({ where, include, orderBy: { [query.sortBy]: query.sortOrder }, skip: query.skip, take: query.limit }),
      prisma.clipping.count({ where }),
    ]);
    okPaginated(res, data, buildPagination(query.page, query.limit, total));
  })
);
clippingAdminRouter.post(
  "/",
  validate(clippingSchema),
  asyncHandler(async (req, res) => {
    const clipping = await prisma.clipping.create({ data: req.body, include });
    await recordAudit({ req, action: "CREATE", module: "clipping", entity: "Clipping", entityId: clipping.id });
    created(res, clipping, "Clipping criado com sucesso.");
  })
);
clippingAdminRouter.patch(
  "/:id",
  validate(clippingSchema.partial()),
  asyncHandler(async (req, res) => {
    const clipping = await prisma.clipping.update({ where: { id: req.params.id }, data: req.body, include });
    await recordAudit({ req, action: "UPDATE", module: "clipping", entity: "Clipping", entityId: clipping.id });
    ok(res, clipping, "Clipping actualizado com sucesso.");
  })
);
clippingAdminRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await prisma.clipping.delete({ where: { id: req.params.id } });
    await recordAudit({ req, action: "DELETE", module: "clipping", entity: "Clipping", entityId: req.params.id });
    ok(res, null, "Clipping removido com sucesso.");
  })
);
