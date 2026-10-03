import { Router } from "express";
import { z } from "zod";
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

const audioSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  coverImage: z.string().min(1),
  audioUrl: z.string().min(1),
  duration: z.number().int().nonnegative().optional(),
  categoryId: z.string().optional(),
  interviewee: z.string().optional(),
  location: z.string().optional(),
  eventId: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  isFeatured: z.boolean().optional(),
});

/** Lean projection for list views — the detail page fetches the full row separately. */
const AUDIO_LIST_SELECT = {
  id: true,
  title: true,
  slug: true,
  description: true,
  coverImage: true,
  audioUrl: true,
  duration: true,
  category: true,
  interviewee: true,
  location: true,
  isFeatured: true,
  publishedAt: true,
} as const;

export const audiosPublicRouter = Router();
audiosPublicRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const query = parseListQuery(req, "publishedAt");
    const where = {
      status: "PUBLISHED" as const,
      ...(query.search ? { title: { contains: query.search } } : {}),
      ...(query.category ? { category: { slug: query.category } } : {}),
      ...(req.query.featured === "true" ? { isFeatured: true } : {}),
    };
    const [data, total] = await Promise.all([
      prisma.audio.findMany({ where, select: AUDIO_LIST_SELECT, orderBy: { [query.sortBy]: query.sortOrder }, skip: query.skip, take: query.limit }),
      prisma.audio.count({ where }),
    ]);
    okPaginated(res, data, {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit) || 1,
      hasNextPage: query.skip + query.limit < total,
      hasPreviousPage: query.page > 1,
    });
  })
);
audiosPublicRouter.get(
  "/:slug",
  asyncHandler(async (req, res) => {
    const audio = await prisma.audio.findFirst({
      where: { slug: req.params.slug, status: "PUBLISHED" },
      include: { category: true, event: { select: { id: true, title: true, slug: true } } },
    });
    if (!audio) throw AppError.notFound("Áudio não encontrado.");
    ok(res, audio);
  })
);

export const audiosAdminRouter = Router();
audiosAdminRouter.use(authenticate, authorize("audios.manage"));

audiosAdminRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const query = parseListQuery(req, "createdAt");
    const where = query.status ? { status: query.status as never } : {};
    const [total, rows] = await Promise.all([
      prisma.audio.count({ where }),
      prisma.audio.findMany({ where, include: { category: true }, orderBy: { [query.sortBy]: query.sortOrder }, skip: query.skip, take: query.limit }),
    ]);
    okPaginated(res, rows, {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit) || 1,
      hasNextPage: query.skip + query.limit < total,
      hasPreviousPage: query.page > 1,
    });
  })
);
audiosAdminRouter.post(
  "/",
  validate(audioSchema),
  asyncHandler(async (req, res) => {
    const slug = await ensureUniqueSlug(req.body.title, async (c) => Boolean(await prisma.audio.findUnique({ where: { slug: c } })));
    const audio = await prisma.audio.create({
      data: { ...req.body, slug, publishedAt: req.body.status === "PUBLISHED" ? new Date() : null },
      include: { category: true },
    });
    await recordAudit({ req, action: "CREATE", module: "audios", entity: "Audio", entityId: audio.id });
    created(res, audio, "Áudio criado com sucesso.");
  })
);
audiosAdminRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const audio = await prisma.audio.findUnique({ where: { id: req.params.id }, include: { category: true } });
    if (!audio) throw AppError.notFound("Áudio não encontrado.");
    ok(res, audio);
  })
);
audiosAdminRouter.patch(
  "/:id",
  validate(audioSchema.partial()),
  asyncHandler(async (req, res) => {
    const existing = await prisma.audio.findUnique({ where: { id: req.params.id } });
    if (!existing) throw AppError.notFound("Áudio não encontrado.");
    const publishedAt = req.body.status === "PUBLISHED" && existing.status !== "PUBLISHED" ? new Date() : undefined;
    const audio = await prisma.audio.update({
      where: { id: req.params.id },
      data: { ...req.body, ...(publishedAt ? { publishedAt } : {}) },
      include: { category: true },
    });
    await recordAudit({ req, action: "UPDATE", module: "audios", entity: "Audio", entityId: audio.id });
    ok(res, audio, "Áudio actualizado com sucesso.");
  })
);
audiosAdminRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await prisma.audio.delete({ where: { id: req.params.id } });
    await recordAudit({ req, action: "DELETE", module: "audios", entity: "Audio", entityId: req.params.id });
    ok(res, null, "Áudio removido com sucesso.");
  })
);
