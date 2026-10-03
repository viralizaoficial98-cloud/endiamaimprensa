import { Router } from "express";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { asyncHandler } from "../../common/async-handler";
import { created, ok, okPaginated } from "../../common/api-response";
import { AppError } from "../../common/app-error";
import { parseListQuery } from "../../common/list-query";
import { authenticate } from "../../guards/authenticate";
import { authorize } from "../../guards/authorize";
import { validate } from "../../middleware/validate";
import { ensureUniqueSlug } from "../../utils/slug";
import { recordAudit } from "../audit/audit.service";
import { recordContentView } from "../analytics/analytics.service";

const videoSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  thumbnail: z.string().min(1),
  thumbnailAlt: z.string().optional(),
  videoUrl: z.string().min(1),
  videoType: z.enum(["UPLOAD", "YOUTUBE", "VIMEO", "EXTERNAL"]).optional(),
  duration: z.number().int().nonnegative().optional(),
  categoryId: z.string().min(1),
  authorName: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  isFeatured: z.boolean().optional(),
  // Editorial/original publication date — lets migrated historical videos keep their
  // real date instead of "now". Optional: publishing without one falls back to now.
  publishedAt: z.string().datetime({ message: "Data de publicação inválida." }).optional().nullable(),
});

const include = { category: true } as const;

/** Fresh each call, mirroring News's publishedWhere() — a video scheduled with a
 * future editorial publishedAt must stay excluded from every public query until
 * that moment arrives. */
function publicWhere(): Prisma.VideoWhereInput {
  return { status: "PUBLISHED", publishedAt: { lte: new Date() } };
}

export const videosPublicRouter = Router();
videosPublicRouter.get(
  "/",
  asyncHandler(async (_req, res) => ok(res, await prisma.video.findMany({ where: publicWhere(), include, orderBy: { publishedAt: "desc" } })))
);
videosPublicRouter.get(
  "/:slug",
  asyncHandler(async (req, res) => {
    const video = await prisma.video.findFirst({ where: { slug: req.params.slug, ...publicWhere() }, include });
    if (!video) throw AppError.notFound("Vídeo não encontrado.");
    if (await recordContentView("video", video.id, req)) {
      await prisma.video.update({ where: { id: video.id }, data: { viewsCount: { increment: 1 } } });
      video.viewsCount += 1;
    }
    ok(res, video);
  })
);

export const videosAdminRouter = Router();
videosAdminRouter.use(authenticate, authorize("videos.manage"));

videosAdminRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const query = parseListQuery(req);
    const where: Prisma.VideoWhereInput = {};
    if (query.status) where.status = query.status as never;
    if (query.category) where.category = { slug: query.category };
    if (query.search) where.title = { contains: query.search };
    if (query.dateFrom || query.dateTo) {
      where.publishedAt = {
        ...(query.dateFrom ? { gte: query.dateFrom } : {}),
        ...(query.dateTo ? { lte: query.dateTo } : {}),
      };
    }
    const [total, rows] = await Promise.all([
      prisma.video.count({ where }),
      prisma.video.findMany({ where, include, orderBy: { [query.sortBy]: query.sortOrder }, skip: query.skip, take: query.limit }),
    ]);
    okPaginated(res, rows, { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) || 1, hasNextPage: query.skip + query.limit < total, hasPreviousPage: query.page > 1 });
  })
);
videosAdminRouter.post(
  "/",
  validate(videoSchema),
  asyncHandler(async (req, res) => {
    const { publishedAt, ...body } = req.body as z.infer<typeof videoSchema>;
    const slug = await ensureUniqueSlug(body.title, async (c) => Boolean(await prisma.video.findUnique({ where: { slug: c } })));
    const resolvedPublishedAt = publishedAt ? new Date(publishedAt) : body.status === "PUBLISHED" ? new Date() : null;
    const video = await prisma.video.create({ data: { ...body, slug, publishedAt: resolvedPublishedAt }, include });
    await recordAudit({ req, action: "CREATE", module: "videos", entity: "Video", entityId: video.id });
    created(res, video, "Vídeo criado com sucesso.");
  })
);
videosAdminRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const video = await prisma.video.findUnique({ where: { id: req.params.id }, include });
    if (!video) throw AppError.notFound("Vídeo não encontrado.");
    ok(res, video);
  })
);
videosAdminRouter.patch(
  "/:id",
  validate(videoSchema.partial()),
  asyncHandler(async (req, res) => {
    const existing = await prisma.video.findUnique({ where: { id: req.params.id } });
    if (!existing) throw AppError.notFound("Vídeo não encontrado.");
    const { publishedAt, ...body } = req.body as Partial<z.infer<typeof videoSchema>>;

    // An explicit date always wins (editing the editorial date). Otherwise, only
    // stamp "now" the first time a video is published — preserves a manually-set
    // historical date across unpublish/republish cycles instead of clobbering it.
    let resolvedPublishedAt: Date | null | undefined;
    if (publishedAt !== undefined) {
      resolvedPublishedAt = publishedAt ? new Date(publishedAt) : null;
    } else if (body.status === "PUBLISHED" && !existing.publishedAt) {
      resolvedPublishedAt = new Date();
    }

    const video = await prisma.video.update({
      where: { id: req.params.id },
      data: { ...body, ...(resolvedPublishedAt !== undefined ? { publishedAt: resolvedPublishedAt } : {}) },
      include,
    });
    await recordAudit({ req, action: "UPDATE", module: "videos", entity: "Video", entityId: video.id });
    ok(res, video, "Vídeo actualizado com sucesso.");
  })
);
videosAdminRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await prisma.video.delete({ where: { id: req.params.id } });
    await recordAudit({ req, action: "DELETE", module: "videos", entity: "Video", entityId: req.params.id });
    ok(res, null, "Vídeo removido com sucesso.");
  })
);
