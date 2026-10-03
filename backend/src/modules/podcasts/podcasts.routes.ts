import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { asyncHandler } from "../../common/async-handler";
import { created, ok } from "../../common/api-response";
import { AppError } from "../../common/app-error";
import { authenticate } from "../../guards/authenticate";
import { authorize } from "../../guards/authorize";
import { validate } from "../../middleware/validate";
import { ensureUniqueSlug } from "../../utils/slug";
import { recordAudit } from "../audit/audit.service";

const podcastSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  coverImage: z.string().min(1),
  author: z.string().optional(),
  categoryId: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
});

const episodeSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  audioUrl: z.string().min(1),
  duration: z.number().int().nonnegative().optional(),
  episodeNumber: z.number().int().positive(),
  seasonNumber: z.number().int().positive().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
});

const include = { category: true, episodes: { orderBy: { episodeNumber: "desc" as const } } };

export const podcastsPublicRouter = Router();
podcastsPublicRouter.get(
  "/",
  asyncHandler(async (_req, res) => ok(res, await prisma.podcast.findMany({ where: { status: "PUBLISHED" }, include, orderBy: { createdAt: "desc" } })))
);
podcastsPublicRouter.get(
  "/:slug",
  asyncHandler(async (req, res) => {
    const podcast = await prisma.podcast.findFirst({ where: { slug: req.params.slug, status: "PUBLISHED" }, include });
    if (!podcast) throw AppError.notFound("Podcast não encontrado.");
    ok(res, podcast);
  })
);

export const podcastsAdminRouter = Router();
podcastsAdminRouter.use(authenticate, authorize("podcasts.manage"));

podcastsAdminRouter.get("/", asyncHandler(async (_req, res) => ok(res, await prisma.podcast.findMany({ include, orderBy: { createdAt: "desc" } }))));
podcastsAdminRouter.post(
  "/",
  validate(podcastSchema),
  asyncHandler(async (req, res) => {
    const slug = await ensureUniqueSlug(req.body.title, async (c) => Boolean(await prisma.podcast.findUnique({ where: { slug: c } })));
    const podcast = await prisma.podcast.create({ data: { ...req.body, slug }, include });
    await recordAudit({ req, action: "CREATE", module: "podcasts", entity: "Podcast", entityId: podcast.id });
    created(res, podcast, "Podcast criado com sucesso.");
  })
);
podcastsAdminRouter.patch(
  "/:id",
  validate(podcastSchema.partial()),
  asyncHandler(async (req, res) => {
    const podcast = await prisma.podcast.update({ where: { id: req.params.id }, data: req.body, include });
    await recordAudit({ req, action: "UPDATE", module: "podcasts", entity: "Podcast", entityId: podcast.id });
    ok(res, podcast, "Podcast actualizado com sucesso.");
  })
);
podcastsAdminRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await prisma.podcast.delete({ where: { id: req.params.id } });
    await recordAudit({ req, action: "DELETE", module: "podcasts", entity: "Podcast", entityId: req.params.id });
    ok(res, null, "Podcast removido com sucesso.");
  })
);

podcastsAdminRouter.post(
  "/:podcastId/episodes",
  validate(episodeSchema),
  asyncHandler(async (req, res) => {
    const slug = await ensureUniqueSlug(`${req.params.podcastId}-${req.body.title}`, async (c) => Boolean(await prisma.podcastEpisode.findUnique({ where: { slug: c } })));
    const episode = await prisma.podcastEpisode.create({
      data: { ...req.body, slug, podcastId: req.params.podcastId, publishedAt: req.body.status === "PUBLISHED" ? new Date() : null },
    });
    await recordAudit({ req, action: "CREATE", module: "podcasts", entity: "PodcastEpisode", entityId: episode.id });
    created(res, episode, "Episódio criado com sucesso.");
  })
);
podcastsAdminRouter.patch(
  "/episodes/:id",
  validate(episodeSchema.partial()),
  asyncHandler(async (req, res) => {
    const episode = await prisma.podcastEpisode.update({ where: { id: req.params.id }, data: req.body });
    await recordAudit({ req, action: "UPDATE", module: "podcasts", entity: "PodcastEpisode", entityId: episode.id });
    ok(res, episode, "Episódio actualizado com sucesso.");
  })
);
podcastsAdminRouter.delete(
  "/episodes/:id",
  asyncHandler(async (req, res) => {
    await prisma.podcastEpisode.delete({ where: { id: req.params.id } });
    await recordAudit({ req, action: "DELETE", module: "podcasts", entity: "PodcastEpisode", entityId: req.params.id });
    ok(res, null, "Episódio removido com sucesso.");
  })
);
