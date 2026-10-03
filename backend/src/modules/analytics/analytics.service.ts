import type { Request } from "express";
import { prisma } from "../../config/prisma";

const DEDUP_WINDOW_MS = 30 * 60_000;

function detectDevice(userAgent: string): string {
  if (/mobile/i.test(userAgent)) return "mobile";
  if (/tablet|ipad/i.test(userAgent)) return "tablet";
  return "desktop";
}

function detectBrowser(userAgent: string): string {
  if (/edg/i.test(userAgent)) return "Edge";
  if (/chrome/i.test(userAgent)) return "Chrome";
  if (/firefox/i.test(userAgent)) return "Firefox";
  if (/safari/i.test(userAgent)) return "Safari";
  return "Outro";
}

function detectOs(userAgent: string): string {
  if (/windows/i.test(userAgent)) return "Windows";
  if (/mac os/i.test(userAgent)) return "macOS";
  if (/android/i.test(userAgent)) return "Android";
  if (/iphone|ipad|ios/i.test(userAgent)) return "iOS";
  if (/linux/i.test(userAgent)) return "Linux";
  return "Outro";
}

/**
 * Records a page view, returning `true` only when it counts as a fresh view
 * (i.e. the same visitor hasn't viewed this content within the dedup window),
 * so callers can decide whether to bump a denormalised counter.
 */
export async function recordContentView(contentType: string, contentId: string, req?: Request): Promise<boolean> {
  const ipAddress = req?.ip ?? "unknown";
  const userAgent = req?.headers["user-agent"] ?? "";

  const recent = await prisma.contentView.findFirst({
    where: {
      contentType,
      contentId,
      ipAddress,
      createdAt: { gte: new Date(Date.now() - DEDUP_WINDOW_MS) },
    },
  });

  await prisma.contentView.create({
    data: {
      contentType,
      contentId,
      ipAddress,
      sessionId: req?.headers["x-session-id"] as string | undefined,
      userAgent,
      referrer: req?.headers.referer as string | undefined,
      device: detectDevice(userAgent),
      browser: detectBrowser(userAgent),
      operatingSystem: detectOs(userAgent),
    },
  });

  return !recent;
}

export async function dashboardSummary() {
  const [
    totalNews,
    published,
    drafts,
    underReview,
    scheduled,
    totalViewsAgg,
    activeUsers,
    pendingComments,
    subscribers,
    upcomingEvents,
  ] = await Promise.all([
    prisma.news.count({ where: { deletedAt: null } }),
    prisma.news.count({ where: { deletedAt: null, status: "PUBLISHED" } }),
    prisma.news.count({ where: { deletedAt: null, status: "DRAFT" } }),
    prisma.news.count({ where: { deletedAt: null, status: "UNDER_REVIEW" } }),
    prisma.news.count({ where: { deletedAt: null, status: "SCHEDULED" } }),
    prisma.news.aggregate({ where: { deletedAt: null }, _sum: { viewsCount: true } }),
    prisma.user.count({ where: { deletedAt: null, status: "ACTIVE" } }),
    prisma.comment.count({ where: { status: "PENDING" } }),
    prisma.newsletterSubscriber.count({ where: { status: "CONFIRMED" } }),
    prisma.event.count({ where: { status: { in: ["UPCOMING", "ONGOING"] } } }),
  ]);

  return {
    totalNews,
    published,
    drafts,
    underReview,
    scheduled,
    totalViews: totalViewsAgg._sum.viewsCount ?? 0,
    activeUsers,
    pendingComments,
    newsletterSubscribers: subscribers,
    upcomingEvents,
  };
}

export async function topNews(limit = 10) {
  return prisma.news.findMany({
    where: { deletedAt: null, status: "PUBLISHED" },
    orderBy: { viewsCount: "desc" },
    take: limit,
    select: { id: true, title: true, slug: true, viewsCount: true, likesCount: true, publishedAt: true },
  });
}

export async function categoriesBreakdown() {
  const grouped = await prisma.news.groupBy({
    by: ["categoryId"],
    where: { deletedAt: null, status: "PUBLISHED" },
    _count: { _all: true },
    _sum: { viewsCount: true },
  });
  const categories = await prisma.category.findMany({ where: { id: { in: grouped.map((g) => g.categoryId) } } });
  return grouped.map((g) => ({
    category: categories.find((c) => c.id === g.categoryId),
    newsCount: g._count._all,
    totalViews: g._sum.viewsCount ?? 0,
  }));
}

export async function authorsBreakdown() {
  const grouped = await prisma.news.groupBy({
    by: ["authorId"],
    where: { deletedAt: null, status: "PUBLISHED" },
    _count: { _all: true },
  });
  const authors = await prisma.user.findMany({ where: { id: { in: grouped.map((g) => g.authorId) } } });
  return grouped.map((g) => ({
    author: authors.find((a) => a.id === g.authorId),
    newsCount: g._count._all,
  }));
}

export async function trafficBreakdown() {
  const since = new Date(Date.now() - 30 * 86_400_000);
  const views = await prisma.contentView.findMany({ where: { createdAt: { gte: since } }, select: { device: true, browser: true, operatingSystem: true } });

  const tally = (key: "device" | "browser" | "operatingSystem") => {
    const map = new Map<string, number>();
    for (const v of views) {
      const value = v[key] ?? "Desconhecido";
      map.set(value, (map.get(value) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([label, count]) => ({ label, count }));
  };

  return {
    totalViews: views.length,
    byDevice: tally("device"),
    byBrowser: tally("browser"),
    byOperatingSystem: tally("operatingSystem"),
  };
}

export async function viewsOverTime(days = 14) {
  const since = new Date(Date.now() - days * 86_400_000);
  const views = await prisma.contentView.findMany({
    where: { createdAt: { gte: since }, contentType: "news" },
    select: { createdAt: true },
  });
  const byDay = new Map<string, number>();
  for (const v of views) {
    const day = v.createdAt.toISOString().slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + 1);
  }
  return Array.from(byDay.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
