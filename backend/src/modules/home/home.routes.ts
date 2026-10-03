import { Router } from "express";
import { prisma } from "../../config/prisma";
import { asyncHandler } from "../../common/async-handler";
import { ok } from "../../common/api-response";
import * as newsService from "../news/news.service";

export const homeRouter = Router();

/**
 * @openapi
 * /public/home:
 *   get:
 *     tags: [Public]
 *     summary: Devolve, num único pedido, todos os dados necessários para a homepage do portal
 *     responses:
 *       200: { description: Dados agregados da homepage }
 */
homeRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const now = new Date();

    const [
      banners,
      breakingNews,
      featuredNews,
      latestNews,
      mostReadNews,
      videos,
      podcasts,
      galleries,
      interviews,
      events,
      documents,
      partners,
      categories,
      infographics,
      reports,
      internationalNews,
      settingsRows,
    ] = await Promise.all([
      prisma.banner.findMany({
        where: {
          status: "ACTIVE",
          AND: [{ OR: [{ startsAt: null }, { startsAt: { lte: now } }] }, { OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
        },
        include: { category: true, news: { select: { id: true, slug: true, title: true } } },
        orderBy: { order: "asc" },
      }),
      newsService.getBreaking(6),
      newsService.getFeatured(6),
      newsService.getLatest(12),
      newsService.getMostRead(8),
      prisma.video.findMany({ where: { status: "PUBLISHED" }, include: { category: true }, orderBy: { publishedAt: "desc" }, take: 8 }),
      prisma.podcast.findMany({ where: { status: "PUBLISHED" }, include: { category: true, episodes: { orderBy: { episodeNumber: "desc" }, take: 1 } }, orderBy: { createdAt: "desc" }, take: 6 }),
      prisma.gallery.findMany({ where: { status: "PUBLISHED" }, include: { galleryCategory: true, images: { orderBy: { order: "asc" }, take: 1 } }, orderBy: { createdAt: "desc" }, take: 9 }),
      prisma.interview.findMany({ where: { status: "PUBLISHED" }, include: { category: true }, orderBy: { publishedAt: "desc" }, take: 4 }),
      prisma.event.findMany({ where: { status: { in: ["UPCOMING", "ONGOING"] } }, orderBy: { startDate: "asc" }, take: 4 }),
      prisma.document.findMany({ where: { status: "PUBLISHED" }, include: { category: true }, orderBy: { createdAt: "desc" }, take: 5 }),
      prisma.partner.findMany({ where: { status: "ACTIVE" }, orderBy: { order: "asc" } }),
      prisma.category.findMany({ where: { status: "ACTIVE" }, orderBy: { order: "asc" } }),
      newsService.getByFormat("infographic", 4),
      newsService.getByFormat("report", 4),
      newsService.getByFormat("international", 6),
      prisma.setting.findMany({ where: { group: { in: ["GENERAL", "APPEARANCE", "SOCIAL", "PORTAL", "SEO"] } } }),
    ]);

    const settings = Object.fromEntries(settingsRows.map((s) => [s.key, s.value]));

    ok(res, {
      banners,
      breakingNews,
      featuredNews,
      latestNews,
      mostReadNews,
      videos,
      podcasts,
      galleries,
      interviews,
      events,
      documents,
      partners,
      categories,
      infographics,
      reports,
      internationalNews,
      settings,
    });
  })
);
