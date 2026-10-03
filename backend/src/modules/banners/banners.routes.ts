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

const bannerSchema = z.object({
  title: z.string().min(2),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  image: z.string().min(1),
  imageAlt: z.string().optional(),
  mobileImage: z.string().optional(),
  videoUrl: z.string().optional(),
  categoryId: z.string().optional(),
  newsId: z.string().optional(),
  tagIds: z.array(z.string()).optional(),
  buttonText: z.string().optional(),
  buttonUrl: z.string().optional(),
  secondaryButtonText: z.string().optional(),
  secondaryButtonUrl: z.string().optional(),
  overlayOpacity: z.number().min(0).max(1).optional(),
  textPosition: z.enum(["LEFT", "CENTER", "RIGHT"]).optional(),
  order: z.number().int().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  startsAt: z.string().datetime().optional().nullable(),
  endsAt: z.string().datetime().optional().nullable(),
});

const adminInclude = {
  category: true,
  news: { select: { id: true, slug: true, title: true, status: true, coverImage: true } },
  tags: { include: { tag: true } },
} as const;

const publicInclude = {
  category: true,
  news: { select: { id: true, slug: true, title: true } },
  tags: { include: { tag: true } },
} as const;

function serialize<T extends { tags: { tag: unknown }[] }>(banner: T) {
  return { ...banner, tags: banner.tags.map((t) => t.tag) };
}

export const bannersPublicRouter = Router();
bannersPublicRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const now = new Date();
    const banners = await prisma.banner.findMany({
      where: {
        status: "ACTIVE",
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        ],
      },
      include: publicInclude,
      orderBy: { order: "asc" },
    });
    ok(res, banners.map(serialize));
  })
);

export const bannersAdminRouter = Router();
bannersAdminRouter.use(authenticate, authorize("banners.manage"));

bannersAdminRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const banners = await prisma.banner.findMany({ include: adminInclude, orderBy: { order: "asc" } });
    ok(res, banners.map(serialize));
  })
);
bannersAdminRouter.post(
  "/",
  validate(bannerSchema),
  asyncHandler(async (req, res) => {
    const { tagIds, ...data } = req.body as z.infer<typeof bannerSchema>;
    const banner = await prisma.banner.create({
      data: { ...data, tags: tagIds?.length ? { create: tagIds.map((tagId) => ({ tagId })) } : undefined },
      include: adminInclude,
    });
    await recordAudit({ req, action: "CREATE", module: "banners", entity: "Banner", entityId: banner.id, newData: { title: banner.title } });
    created(res, serialize(banner), "Banner criado com sucesso.");
  })
);
bannersAdminRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const banner = await prisma.banner.findUnique({ where: { id: req.params.id }, include: adminInclude });
    if (!banner) throw AppError.notFound("Banner não encontrado.");
    ok(res, serialize(banner));
  })
);
bannersAdminRouter.patch(
  "/:id",
  validate(bannerSchema.partial()),
  asyncHandler(async (req, res) => {
    const { tagIds, ...data } = req.body as Partial<z.infer<typeof bannerSchema>>;
    if (tagIds !== undefined) {
      await prisma.bannerTag.deleteMany({ where: { bannerId: req.params.id } });
    }
    const banner = await prisma.banner.update({
      where: { id: req.params.id },
      data: { ...data, tags: tagIds !== undefined ? (tagIds.length ? { create: tagIds.map((tagId) => ({ tagId })) } : undefined) : undefined },
      include: adminInclude,
    });
    await recordAudit({ req, action: "UPDATE", module: "banners", entity: "Banner", entityId: banner.id, newData: { title: banner.title } });
    ok(res, serialize(banner), "Banner actualizado com sucesso.");
  })
);
bannersAdminRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await prisma.banner.delete({ where: { id: req.params.id } });
    await recordAudit({ req, action: "DELETE", module: "banners", entity: "Banner", entityId: req.params.id });
    ok(res, null, "Banner removido com sucesso.");
  })
);
bannersAdminRouter.post(
  "/reorder",
  validate(z.object({ order: z.array(z.object({ id: z.string(), order: z.number().int() })) })),
  asyncHandler(async (req, res) => {
    await prisma.$transaction(
      req.body.order.map((item: { id: string; order: number }) =>
        prisma.banner.update({ where: { id: item.id }, data: { order: item.order } })
      )
    );
    await recordAudit({ req, action: "REORDER", module: "banners", entity: "Banner", entityId: "bulk" });
    ok(res, null, "Ordem dos banners actualizada com sucesso.");
  })
);
