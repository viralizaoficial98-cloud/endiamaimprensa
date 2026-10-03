import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import { corsAllowedOrigins, env } from "./config/env";
import { logger } from "./config/logger";
import { swaggerSpec } from "./config/swagger";
import { prisma } from "./config/prisma";
import { errorHandler, notFoundHandler } from "./middleware/error-handler";
import { apiRateLimiter } from "./middleware/rate-limit";
import { UPLOAD_ROOT } from "./modules/uploads/upload.config";

import { authRouter } from "./modules/auth/auth.routes";
import { newsAdminRouter } from "./modules/news/news.routes";
import { newsPublicRouter } from "./modules/news/news.public.routes";
import { categoriesAdminRouter, categoriesPublicRouter } from "./modules/categories/categories.routes";
import { tagsAdminRouter, tagsPublicRouter } from "./modules/tags/tags.routes";
import { bannersAdminRouter, bannersPublicRouter } from "./modules/banners/banners.routes";
import { latestNewsAdminRouter, latestNewsPublicRouter } from "./modules/latest-news/latest-news.routes";
import { videosAdminRouter, videosPublicRouter } from "./modules/videos/videos.routes";
import { audiosAdminRouter, audiosPublicRouter } from "./modules/audios/audios.routes";
import { podcastsAdminRouter, podcastsPublicRouter } from "./modules/podcasts/podcasts.routes";
import { galleriesAdminRouter, galleriesPublicRouter, galleryCategoriesPublicRouter } from "./modules/galleries/galleries.routes";
import { clippingAdminRouter, clippingPublicRouter } from "./modules/clipping/clipping.routes";
import { interviewsAdminRouter, interviewsPublicRouter } from "./modules/interviews/interviews.routes";
import { eventsAdminRouter, eventsPublicRouter } from "./modules/events/events.routes";
import { documentsAdminRouter, documentsPublicRouter } from "./modules/documents/documents.routes";
import { commentsAdminRouter, commentsPublicRouter } from "./modules/comments/comments.routes";
import { newsletterAdminRouter, newsletterPublicRouter } from "./modules/newsletter/newsletter.routes";
import { menusAdminRouter, menusPublicRouter } from "./modules/menus/menus.routes";
import { settingsAdminRouter, settingsPublicRouter } from "./modules/settings/settings.routes";
import { socialLinksAdminRouter, socialLinksPublicRouter } from "./modules/social-links/social-links.routes";
import { partnersAdminRouter, partnersPublicRouter } from "./modules/partners/partners.routes";
import { advertisementsAdminRouter, advertisementsPublicRouter } from "./modules/advertisements/advertisements.routes";
import { usersRouter } from "./modules/users/users.routes";
import { permissionsRouter, rolesRouter } from "./modules/roles/roles.routes";
import { uploadsRouter } from "./modules/uploads/uploads.routes";
import { analyticsRouter } from "./modules/analytics/analytics.routes";
import { auditRouter } from "./modules/audit/audit.routes";
import { notificationsRouter } from "./modules/notifications/notifications.routes";
import { homeRouter } from "./modules/home/home.routes";
import { getLatest as getLatestNews } from "./modules/news/news.service";

export function createApp(): Express {
  const app = express();

  app.set("trust proxy", 1);
  // This API and its /uploads media are always consumed from a separate frontend
  // origin (different port) — helmet's same-origin default blocks the browser
  // from actually using cross-origin video/media responses even though the
  // request itself succeeds, so it's relaxed here for this public, unauthenticated content.
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || corsAllowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error(`Origem não permitida por CORS: ${origin}`));
      },
      credentials: true,
    })
  );
  app.use(compression());
  app.use(express.json({ limit: "5mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(morgan(env.isProduction ? "combined" : "dev", { stream: { write: (msg) => logger.info(msg.trim()) } }));
  app.use("/api", apiRateLimiter);

  app.use("/uploads", express.static(UPLOAD_ROOT, { maxAge: "30d" }));

  app.get("/health", async (_req, res) => {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ success: true, message: "API operacional.", data: { uptime: process.uptime() } });
  });

  app.get("/api/health", async (_req, res) => {
    let database: "connected" | "disconnected" = "disconnected";
    try {
      await prisma.$queryRaw`SELECT 1`;
      database = "connected";
    } catch {
      database = "disconnected";
    }
    res.status(database === "connected" ? 200 : 503).json({
      success: database === "connected",
      status: database === "connected" ? "ok" : "error",
      database,
      timestamp: new Date().toISOString(),
    });
  });

  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customSiteTitle: "ENDIAMA Notícias — API Docs" }));
  app.get("/api/docs.json", (_req, res) => res.json(swaggerSpec));

  app.use("/api/auth", authRouter);
  app.use("/api/notifications", notificationsRouter);

  // ── Public API ──────────────────────────────────────────────────────────
  // Short, safe HTTP cache for read-only public content: absorbs bursts/repeat
  // requests without delaying a newly-published article by more than ~30s.
  app.use("/api/public", (req, res, next) => {
    if (req.method === "GET") res.set("Cache-Control", "public, max-age=30, stale-while-revalidate=120");
    next();
  });
  app.use("/api/public/home", homeRouter);
  app.use("/api/public/news", newsPublicRouter);
  app.use("/api/public/categories", categoriesPublicRouter);
  app.use("/api/public/tags", tagsPublicRouter);
  app.use("/api/public/banners", bannersPublicRouter);
  app.use("/api/public/latest-news", latestNewsPublicRouter);
  app.use("/api/public/videos", videosPublicRouter);
  app.use("/api/public/audios", audiosPublicRouter);
  app.use("/api/public/podcasts", podcastsPublicRouter);
  app.use("/api/public/galleries", galleriesPublicRouter);
  app.use("/api/public/gallery-categories", galleryCategoriesPublicRouter);
  app.use("/api/public/interviews", interviewsPublicRouter);
  app.use("/api/public/events", eventsPublicRouter);
  app.use("/api/public/documents", documentsPublicRouter);
  app.use("/api/public/clippings", clippingPublicRouter);
  app.use("/api/public/comments", commentsPublicRouter);
  app.use("/api/public/newsletter", newsletterPublicRouter);
  app.use("/api/public/menus", menusPublicRouter);
  app.use("/api/public/settings", settingsPublicRouter);
  app.use("/api/public/social-links", socialLinksPublicRouter);
  app.use("/api/public/partners", partnersPublicRouter);
  app.use("/api/public/advertisements", advertisementsPublicRouter);

  // ── Admin API ────────────────────────────────────────────────────────────
  app.use("/api/admin/news", newsAdminRouter);
  app.use("/api/admin/categories", categoriesAdminRouter);
  app.use("/api/admin/tags", tagsAdminRouter);
  app.use("/api/admin/banners", bannersAdminRouter);
  app.use("/api/admin/latest-news", latestNewsAdminRouter);
  app.use("/api/admin/videos", videosAdminRouter);
  app.use("/api/admin/audios", audiosAdminRouter);
  app.use("/api/admin/podcasts", podcastsAdminRouter);
  app.use("/api/admin/galleries", galleriesAdminRouter);
  app.use("/api/admin/interviews", interviewsAdminRouter);
  app.use("/api/admin/events", eventsAdminRouter);
  app.use("/api/admin/documents", documentsAdminRouter);
  app.use("/api/admin/clippings", clippingAdminRouter);
  app.use("/api/admin/comments", commentsAdminRouter);
  app.use("/api/admin/newsletter", newsletterAdminRouter);
  app.use("/api/admin/menus", menusAdminRouter);
  app.use("/api/admin/settings", settingsAdminRouter);
  app.use("/api/admin/social-links", socialLinksAdminRouter);
  app.use("/api/admin/partners", partnersAdminRouter);
  app.use("/api/admin/advertisements", advertisementsAdminRouter);
  app.use("/api/admin/users", usersRouter);
  app.use("/api/admin/roles", rolesRouter);
  app.use("/api/admin/permissions", permissionsRouter);
  app.use("/api/admin/uploads", uploadsRouter);
  app.use("/api/admin/dashboard", analyticsRouter);
  app.use("/api/admin/audit", auditRouter);

  // ── SEO ──────────────────────────────────────────────────────────────────
  app.get("/robots.txt", (_req, res) => {
    res.type("text/plain").send(`User-agent: *\nAllow: /\nSitemap: ${env.frontendUrl}/sitemap.xml\n`);
  });

  app.get("/sitemap.xml", async (_req, res) => {
    const news = await getLatestNews(500);
    const urls = news
      .map((n) => `<url><loc>${env.frontendUrl}/noticia/${n.slug}</loc><lastmod>${(n.updatedAt ?? n.publishedAt)?.toISOString()}</lastmod></url>`)
      .join("");
    res.type("application/xml").send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`);
  });

  app.get("/rss.xml", async (_req, res) => {
    const news = await getLatestNews(50);
    const items = news
      .map(
        (n) =>
          `<item><title><![CDATA[${n.title}]]></title><link>${env.frontendUrl}/noticia/${n.slug}</link><description><![CDATA[${n.excerpt}]]></description><pubDate>${n.publishedAt?.toUTCString()}</pubDate><guid>${env.frontendUrl}/noticia/${n.slug}</guid></item>`
      )
      .join("");
    res
      .type("application/rss+xml")
      .send(
        `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>ENDIAMA Notícias</title><link>${env.frontendUrl}</link><description>Portal de Notícias da ENDIAMA E.P.</description>${items}</channel></rss>`
      );
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
