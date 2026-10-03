import type { LatestNewsConfig, LatestNewsItem, Prisma } from "@prisma/client";
import type { Request } from "express";
import { prisma } from "../../config/prisma";
import { AppError } from "../../common/app-error";
import { type Locale } from "../../common/locale";
import { recordAudit } from "../audit/audit.service";
import * as newsService from "../news/news.service";
import type { setItemSchema, updateConfigSchema } from "./latest-news.validators";
import { z } from "zod";

type UpdateConfigInput = z.infer<typeof updateConfigSchema>;
type SetItemInput = z.infer<typeof setItemSchema>;

async function getOrCreateConfig(userId?: string): Promise<LatestNewsConfig> {
  const existing = await prisma.latestNewsConfig.findFirst();
  if (existing) return existing;
  return prisma.latestNewsConfig.create({ data: { createdById: userId, updatedById: userId } });
}

function pickScalar(c: LatestNewsConfig) {
  return {
    title: c.title,
    subtitle: c.subtitle,
    showSection: c.showSection,
    showBreakingBar: c.showBreakingBar,
    showViewAll: c.showViewAll,
    viewAllLabel: c.viewAllLabel,
    breakingNewsId: c.breakingNewsId,
    breakingTitle: c.breakingTitle,
    breakingActive: c.breakingActive,
  };
}

function itemKey(i: LatestNewsItem) {
  return `${i.newsId}:${i.position}:${i.sortOrder}:${i.active}`;
}

function isPublishedInSync(config: LatestNewsConfig, draftItems: LatestNewsItem[], publishedItems: LatestNewsItem[]): boolean {
  if (!config.publishedAt) return false;
  const scalarsEqual =
    config.title === config.publishedTitle &&
    config.subtitle === config.publishedSubtitle &&
    config.showSection === config.publishedShowSection &&
    config.showBreakingBar === config.publishedShowBreakingBar &&
    config.showViewAll === config.publishedShowViewAll &&
    config.viewAllLabel === config.publishedViewAllLabel &&
    (config.breakingNewsId ?? null) === (config.publishedBreakingNewsId ?? null) &&
    (config.breakingTitle ?? null) === (config.publishedBreakingTitle ?? null) &&
    config.breakingActive === config.publishedBreakingActive &&
    (config.breakingStartsAt?.getTime() ?? null) === (config.publishedBreakingStartsAt?.getTime() ?? null) &&
    (config.breakingEndsAt?.getTime() ?? null) === (config.publishedBreakingEndsAt?.getTime() ?? null);
  if (!scalarsEqual) return false;

  const draftKeys = draftItems.map(itemKey).sort();
  const publishedKeys = publishedItems.map(itemKey).sort();
  return JSON.stringify(draftKeys) === JSON.stringify(publishedKeys);
}

export async function getAdminConfig() {
  const config = await getOrCreateConfig();
  const [draftItems, publishedItems] = await Promise.all([
    prisma.latestNewsItem.findMany({ where: { configId: config.id, state: "DRAFT" } }),
    prisma.latestNewsItem.findMany({ where: { configId: config.id, state: "PUBLISHED" } }),
  ]);

  const newsIds = [...new Set([...draftItems.map((i) => i.newsId), ...(config.breakingNewsId ? [config.breakingNewsId] : [])])];
  const newsRows = await newsService.getByIds(newsIds);
  const newsById = new Map(newsRows.map((n) => [n.id, n]));

  const draftWithNews = draftItems.map((i) => ({ ...i, news: newsById.get(i.newsId) ?? null }));
  const main = draftWithNews.find((i) => i.position === "MAIN") ?? null;
  const secondary = draftWithNews.filter((i) => i.position === "SECONDARY").sort((a, b) => a.sortOrder - b.sortOrder);
  const breakingNews = config.breakingNewsId ? (newsById.get(config.breakingNewsId) ?? null) : null;

  return {
    config,
    main,
    secondary,
    breakingNews,
    hasUnpublishedChanges: !isPublishedInSync(config, draftItems, publishedItems),
  };
}

export async function updateConfigSettings(input: UpdateConfigInput, userId: string, req?: Request) {
  const config = await getOrCreateConfig(userId);

  if (input.breakingNewsId) {
    const news = await newsService.getByIds([input.breakingNewsId]);
    if (news.length === 0) {
      throw AppError.badRequest("A notícia seleccionada para Última Hora não existe ou não está publicada.");
    }
  }

  const data: Prisma.LatestNewsConfigUncheckedUpdateInput = { updatedById: userId };
  if (input.title !== undefined) data.title = input.title;
  if (input.subtitle !== undefined) data.subtitle = input.subtitle;
  if (input.showSection !== undefined) data.showSection = input.showSection;
  if (input.showBreakingBar !== undefined) data.showBreakingBar = input.showBreakingBar;
  if (input.showViewAll !== undefined) data.showViewAll = input.showViewAll;
  if (input.viewAllLabel !== undefined) data.viewAllLabel = input.viewAllLabel;
  if (input.breakingNewsId !== undefined) data.breakingNewsId = input.breakingNewsId;
  if (input.breakingTitle !== undefined) data.breakingTitle = input.breakingTitle;
  if (input.breakingActive !== undefined) data.breakingActive = input.breakingActive;
  if (input.breakingStartsAt !== undefined) data.breakingStartsAt = input.breakingStartsAt ? new Date(input.breakingStartsAt) : null;
  if (input.breakingEndsAt !== undefined) data.breakingEndsAt = input.breakingEndsAt ? new Date(input.breakingEndsAt) : null;
  if (input.publishAt !== undefined) data.publishAt = input.publishAt ? new Date(input.publishAt) : null;

  const updated = await prisma.latestNewsConfig.update({ where: { id: config.id }, data });
  await recordAudit({
    req,
    userId,
    action: "UPDATE_SETTINGS",
    module: "latest-news",
    entity: "LatestNewsConfig",
    entityId: updated.id,
    oldData: pickScalar(config),
    newData: pickScalar(updated),
  });
  return updated;
}

export async function setItems(items: SetItemInput[], userId: string, req?: Request) {
  const mainItems = items.filter((i) => i.position === "MAIN");
  const secondaryItems = items.filter((i) => i.position === "SECONDARY");
  if (mainItems.length > 1) throw AppError.badRequest("Apenas uma notícia pode ser a Notícia Principal.");
  if (secondaryItems.length > 2) throw AppError.badRequest("Apenas duas notícias secundárias são permitidas.");

  const newsIds = items.map((i) => i.newsId);
  if (new Set(newsIds).size !== newsIds.length) {
    throw AppError.badRequest("Esta notícia já está configurada em outra posição de destaque.");
  }

  if (newsIds.length > 0) {
    const publishedNews = await newsService.getByIds(newsIds);
    if (publishedNews.length !== newsIds.length) {
      throw AppError.badRequest("Só é possível seleccionar notícias publicadas.");
    }
  }

  const config = await getOrCreateConfig(userId);

  await prisma.$transaction([
    prisma.latestNewsItem.deleteMany({ where: { configId: config.id, state: "DRAFT" } }),
    ...items.map((item, index) =>
      prisma.latestNewsItem.create({
        data: {
          configId: config.id,
          newsId: item.newsId,
          position: item.position,
          state: "DRAFT",
          sortOrder: item.sortOrder ?? (item.position === "SECONDARY" ? secondaryItems.findIndex((s) => s.newsId === item.newsId) : 0),
          active: true,
        },
      })
    ),
    prisma.latestNewsConfig.update({ where: { id: config.id }, data: { updatedById: userId } }),
  ]);

  await recordAudit({ req, userId, action: "UPDATE_ITEMS", module: "latest-news", entity: "LatestNewsConfig", entityId: config.id, newData: { items } });
  return getAdminConfig();
}

export async function updateItem(id: string, input: { active?: boolean; sortOrder?: number }, userId: string, req?: Request) {
  const item = await prisma.latestNewsItem.findFirst({ where: { id, state: "DRAFT" } });
  if (!item) throw AppError.notFound("Item não encontrado.");
  const updated = await prisma.latestNewsItem.update({ where: { id }, data: input });
  await prisma.latestNewsConfig.update({ where: { id: item.configId }, data: { updatedById: userId } });
  await recordAudit({ req, userId, action: "UPDATE_ITEM", module: "latest-news", entity: "LatestNewsItem", entityId: id, newData: input });
  return updated;
}

export async function deleteItem(id: string, userId: string, req?: Request) {
  const item = await prisma.latestNewsItem.findFirst({ where: { id, state: "DRAFT" } });
  if (!item) throw AppError.notFound("Item não encontrado.");
  await prisma.latestNewsItem.delete({ where: { id } });
  await prisma.latestNewsConfig.update({ where: { id: item.configId }, data: { updatedById: userId } });
  await recordAudit({ req, userId, action: "REMOVE_ITEM", module: "latest-news", entity: "LatestNewsItem", entityId: id });
}

export async function reorderItems(order: { id: string; sortOrder: number }[], userId: string, req?: Request) {
  await prisma.$transaction(order.map((o) => prisma.latestNewsItem.update({ where: { id: o.id }, data: { sortOrder: o.sortOrder } })));
  await recordAudit({ req, userId, action: "REORDER_ITEMS", module: "latest-news", entity: "LatestNewsConfig", entityId: "bulk" });
}

export async function publish(userId: string, req?: Request) {
  const config = await getOrCreateConfig(userId);
  const mainItem = await prisma.latestNewsItem.findFirst({ where: { configId: config.id, state: "DRAFT", position: "MAIN" } });
  if (!mainItem) throw AppError.badRequest("Seleccione uma notícia principal antes de publicar.");

  const before = await getPublicLatestNews();

  await prisma.$transaction(async (tx) => {
    await tx.latestNewsItem.deleteMany({ where: { configId: config.id, state: "PUBLISHED" } });
    const draftItems = await tx.latestNewsItem.findMany({ where: { configId: config.id, state: "DRAFT" } });
    if (draftItems.length) {
      await tx.latestNewsItem.createMany({
        data: draftItems.map((i) => ({
          configId: config.id,
          newsId: i.newsId,
          position: i.position,
          state: "PUBLISHED" as const,
          sortOrder: i.sortOrder,
          active: i.active,
        })),
      });
    }
    await tx.latestNewsConfig.update({
      where: { id: config.id },
      data: {
        publishedAt: new Date(),
        publishedTitle: config.title,
        publishedSubtitle: config.subtitle,
        publishedShowSection: config.showSection,
        publishedShowBreakingBar: config.showBreakingBar,
        publishedShowViewAll: config.showViewAll,
        publishedViewAllLabel: config.viewAllLabel,
        publishedBreakingNewsId: config.breakingNewsId,
        publishedBreakingTitle: config.breakingTitle,
        publishedBreakingActive: config.breakingActive,
        publishedBreakingStartsAt: config.breakingStartsAt,
        publishedBreakingEndsAt: config.breakingEndsAt,
      },
    });
  });

  const after = await getPublicLatestNews();
  await recordAudit({
    req,
    userId,
    action: "PUBLISH",
    module: "latest-news",
    entity: "LatestNewsConfig",
    entityId: config.id,
    oldData: before,
    newData: after,
  });

  return getAdminConfig();
}

const FALLBACK_TITLE_EN = "Latest News";
const FALLBACK_SUBTITLE_EN = "Follow the main updates from ENDIAMA and the diamond sector.";
const FALLBACK_VIEW_ALL_EN = "View all news";

async function buildFallbackPayload(locale: Locale) {
  // Requirement: when nothing has ever been published from the admin panel, fall back
  // to a safe recency-based selection so the homepage is never empty — but a published
  // admin configuration always takes absolute priority once one exists (see getPublicLatestNews).
  const featured = await newsService.getFeatured(3, locale);
  const pool = featured.length > 0 ? featured : await newsService.getLatest(3, [], locale);
  const [main, ...secondary] = pool;
  const breaking = (await newsService.getBreaking(1, locale))[0] ?? null;

  return {
    title: locale === "en" ? FALLBACK_TITLE_EN : "Últimas Notícias",
    subtitle: locale === "en" ? FALLBACK_SUBTITLE_EN : "Acompanhe as principais actualizações da ENDIAMA e do sector diamantífero.",
    showSection: true,
    showBreakingBar: true,
    showViewAll: true,
    viewAllLabel: locale === "en" ? FALLBACK_VIEW_ALL_EN : "Ver todas as notícias",
    main: main ?? null,
    secondary: secondary.slice(0, 2),
    breaking,
  };
}

export async function getPublicLatestNews(locale: Locale = "pt") {
  const config = await prisma.latestNewsConfig.findFirst();
  if (!config || !config.publishedAt) return buildFallbackPayload(locale);

  const now = new Date();
  const breakingWindowOk =
    (!config.publishedBreakingStartsAt || config.publishedBreakingStartsAt <= now) &&
    (!config.publishedBreakingEndsAt || config.publishedBreakingEndsAt >= now);

  const publishedItems = await prisma.latestNewsItem.findMany({ where: { configId: config.id, state: "PUBLISHED" } });
  const newsIds = [
    ...new Set([
      ...publishedItems.map((i) => i.newsId),
      ...(config.publishedBreakingActive && breakingWindowOk && config.publishedBreakingNewsId ? [config.publishedBreakingNewsId] : []),
    ]),
  ];
  const newsRows = await newsService.getByIds(newsIds, locale);
  const newsById = new Map(newsRows.map((n) => [n.id, n]));

  const mainItem = publishedItems.find((i) => i.position === "MAIN" && i.active);
  const secondaryItems = publishedItems
    .filter((i) => i.position === "SECONDARY" && i.active)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const main = mainItem ? (newsById.get(mainItem.newsId) ?? null) : null;
  const secondary = secondaryItems.map((i) => newsById.get(i.newsId)).filter((n): n is NonNullable<typeof n> => Boolean(n));
  const breaking =
    config.publishedBreakingActive && breakingWindowOk && config.publishedBreakingNewsId
      ? (newsById.get(config.publishedBreakingNewsId) ?? null)
      : null;

  const useEn = locale === "en";
  return {
    title: (useEn && config.publishedTitleEn) || config.publishedTitle || "Últimas Notícias",
    subtitle: (useEn && config.publishedSubtitleEn) || config.publishedSubtitle || "",
    showSection: config.publishedShowSection ?? true,
    showBreakingBar: config.publishedShowBreakingBar ?? true,
    showViewAll: config.publishedShowViewAll ?? true,
    viewAllLabel: (useEn && config.publishedViewAllLabelEn) || config.publishedViewAllLabel || "Ver todas as notícias",
    main,
    secondary,
    breaking,
  };
}
