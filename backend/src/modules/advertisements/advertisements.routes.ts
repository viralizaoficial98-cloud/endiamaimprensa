import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { asyncHandler } from "../../common/async-handler";
import { created, ok } from "../../common/api-response";
import { AppError } from "../../common/app-error";
import { authenticate } from "../../guards/authenticate";
import { authorize } from "../../guards/authorize";
import { validate } from "../../middleware/validate";
import { recordAudit } from "../audit/audit.service";

const adSchema = z.object({
  title: z.string().min(2),
  image: z.string().min(1),
  mobileImage: z.string().optional(),
  url: z.string().optional(),
  position: z.string().min(1),
  startsAt: z.string().datetime().optional().nullable(),
  endsAt: z.string().datetime().optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export const advertisementsPublicRouter = Router();
advertisementsPublicRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const now = new Date();
    const where = {
      status: "ACTIVE" as const,
      AND: [{ OR: [{ startsAt: null }, { startsAt: { lte: now } }] }, { OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
      ...(req.query.position ? { position: String(req.query.position) } : {}),
    };
    const ads = await prisma.advertisement.findMany({ where });
    ok(res, ads);
  })
);
advertisementsPublicRouter.post(
  "/:id/click",
  asyncHandler(async (req, res) => {
    const ad = await prisma.advertisement.update({ where: { id: req.params.id }, data: { clicks: { increment: 1 } } }).catch(() => null);
    if (!ad) throw AppError.notFound("Publicidade não encontrada.");
    ok(res, { url: ad.url });
  })
);
advertisementsPublicRouter.post(
  "/:id/impression",
  asyncHandler(async (req, res) => {
    await prisma.advertisement.update({ where: { id: req.params.id }, data: { impressions: { increment: 1 } } }).catch(() => null);
    ok(res, null);
  })
);

export const advertisementsAdminRouter = Router();
advertisementsAdminRouter.use(authenticate, authorize("settings.manage"));
advertisementsAdminRouter.get("/", asyncHandler(async (_req, res) => ok(res, await prisma.advertisement.findMany({ orderBy: { createdAt: "desc" } }))));
advertisementsAdminRouter.post(
  "/",
  validate(adSchema),
  asyncHandler(async (req, res) => {
    const ad = await prisma.advertisement.create({ data: req.body });
    await recordAudit({ req, action: "CREATE", module: "advertisements", entity: "Advertisement", entityId: ad.id });
    created(res, ad, "Publicidade criada com sucesso.");
  })
);
advertisementsAdminRouter.patch(
  "/:id",
  validate(adSchema.partial()),
  asyncHandler(async (req, res) => {
    const ad = await prisma.advertisement.update({ where: { id: req.params.id }, data: req.body });
    await recordAudit({ req, action: "UPDATE", module: "advertisements", entity: "Advertisement", entityId: ad.id });
    ok(res, ad, "Publicidade actualizada com sucesso.");
  })
);
advertisementsAdminRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await prisma.advertisement.delete({ where: { id: req.params.id } });
    await recordAudit({ req, action: "DELETE", module: "advertisements", entity: "Advertisement", entityId: req.params.id });
    ok(res, null, "Publicidade removida com sucesso.");
  })
);
