import { Prisma } from "@prisma/client";
import type { Request } from "express";
import { prisma } from "../../config/prisma";
import { AppError } from "../../common/app-error";
import { buildPagination, type PaginationMeta } from "../../common/api-response";
import type { ListQuery } from "../../common/list-query";
import { localize, translationStatus, type Locale } from "../../common/locale";
import { ensureUniqueSlug } from "../../utils/slug";
import { sanitizeContentBlocks, sanitizePlainText } from "../../utils/sanitize";
import { recordAudit } from "../audit/audit.service";
import { recordContentView } from "../analytics/analytics.service";
import { notifyUsersWithPermission } from "../notifications/notifications.service";
import type { CreateNewsInput, UpdateNewsInput } from "./news.validators";

const PUBLIC_AUTHOR_SELECT = {
  id: true,
  name: true,
  username: true,
  avatar: true,
  position: true,
  department: true,
} satisfies Prisma.UserSelect;

export const include = {
  category: true,
  author: { select: PUBLIC_AUTHOR_SELECT },
  reviewer: { select: PUBLIC_AUTHOR_SELECT },
  tags: { include: { tag: true } },
} satisfies Prisma.NewsInclude;

type NewsWithRelations = Prisma.NewsGetPayload<{ include: typeof include }>;

/** Fresh each call (never a static object) so `publishedAt <= now` always reflects
 * the current instant — a News row with a future editorial `publishedAt` (scheduled
 * publication) must stay excluded from every public query until that moment arrives. */
export function publishedWhere(): Prisma.NewsWhereInput {
  return { status: "PUBLISHED", deletedAt: null, visibility: "PUBLIC", publishedAt: { lte: new Date() } };
}

export function serialize(news: NewsWithRelations) {
  return {
    ...news,
    tags: news.tags.map((t) => t.tag),
  };
}

const NEWS_FIELD_PAIRS: [string, string][] = [
  ["title", "titleEn"],
  ["subtitle", "subtitleEn"],
  ["excerpt", "excerptEn"],
  ["content", "contentEn"],
  ["coverImageAlt", "coverImageAltEn"],
];
// Only the fields required in Portuguese gate the admin "PT ✓ / EN Pendente"
// indicator — subtitle/coverImageAlt are translatable but optional even in PT.
const NEWS_CORE_FIELD_PAIRS: [string, string][] = [
  ["title", "titleEn"],
  ["excerpt", "excerptEn"],
  ["content", "contentEn"],
];
const CATEGORY_FIELD_PAIRS: [string, string][] = [
  ["name", "nameEn"],
  ["description", "descriptionEn"],
];

/** Admin variant: raw bilingual fields (for the editing form) plus a computed
 * translation-completion flag (for the list's "EN Pendente" badge). */
export function serializeAdmin(news: NewsWithRelations) {
  return { ...serialize(news), _translations: translationStatus(news, NEWS_CORE_FIELD_PAIRS) };
}

/** Public-facing variant of serialize(): resolves title/excerpt/content/... (and
 * the nested category's name/description) to the requested locale, falling back
 * to the original Portuguese text when no translation exists yet — a News row
 * migrated/created PT-only never breaks the EN site, it just displays in PT. */
export function serializePublic(news: NewsWithRelations, locale: Locale) {
  const serialized = serialize(news);
  const localized = localize(serialized, locale, NEWS_FIELD_PAIRS);
  return { ...localized, category: localize(localized.category, locale, CATEGORY_FIELD_PAIRS) };
}

export async function listNews(query: ListQuery, options: { publicOnly?: boolean; locale?: Locale } = {}) {
  const where: Prisma.NewsWhereInput = { deletedAt: null };
  if (options.publicOnly) Object.assign(where, publishedWhere());
  if (query.status && !options.publicOnly) where.status = query.status as Prisma.EnumNewsStatusFilter["equals"];
  if (query.category) where.category = { slug: query.category };
  if (query.author) where.authorId = query.author;
  if (query.isFeatured !== undefined) where.isFeatured = query.isFeatured;
  if (query.isBreaking !== undefined) where.isBreaking = query.isBreaking;
  if (query.excludeIds?.length) where.id = { notIn: query.excludeIds };
  if (query.dateFrom || query.dateTo) {
    where.publishedAt = {
      ...(query.dateFrom ? { gte: query.dateFrom } : {}),
      ...(query.dateTo ? { lte: query.dateTo } : {}),
    };
  }
  if (query.search) {
    where.OR = [
      { title: { contains: query.search } },
      { subtitle: { contains: query.search } },
      { excerpt: { contains: query.search } },
      { category: { name: { contains: query.search } } },
      { author: { name: { contains: query.search } } },
      { tags: { some: { tag: { name: { contains: query.search } } } } },
      ...(options.locale === "en"
        ? [
            { titleEn: { contains: query.search } },
            { excerptEn: { contains: query.search } },
          ]
        : []),
    ];
  }

  const [total, rows] = await Promise.all([
    prisma.news.count({ where }),
    prisma.news.findMany({
      where,
      include,
      orderBy: { [query.sortBy]: query.sortOrder },
      skip: query.skip,
      take: query.limit,
    }),
  ]);

  const pagination: PaginationMeta = buildPagination(query.page, query.limit, total);
  const data = options.publicOnly ? rows.map((n) => serializePublic(n, options.locale ?? "pt")) : rows.map(serializeAdmin);
  return { data, pagination };
}

export async function getNewsById(id: string) {
  const news = await prisma.news.findFirst({ where: { id, deletedAt: null }, include });
  if (!news) throw AppError.notFound("Notícia não encontrada.");
  return serializeAdmin(news);
}

export async function getNewsBySlugPublic(slug: string, req?: Request, locale: Locale = "pt") {
  const news = await prisma.news.findFirst({ where: { slug, ...publishedWhere() }, include });
  if (!news) throw AppError.notFound("Notícia não encontrada.");

  const isNewView = await recordContentView("news", news.id, req);
  if (isNewView) {
    await prisma.news.update({ where: { id: news.id }, data: { viewsCount: { increment: 1 } } });
    news.viewsCount += 1;
  }

  return serializePublic(news, locale);
}

async function nextVersionNumber(newsId: string): Promise<number> {
  const last = await prisma.newsVersion.findFirst({ where: { newsId }, orderBy: { version: "desc" } });
  return (last?.version ?? 0) + 1;
}

async function snapshotVersion(news: NewsWithRelations, editedById: string, changeSummary: string) {
  const version = await nextVersionNumber(news.id);
  await prisma.newsVersion.create({
    data: {
      newsId: news.id,
      version,
      title: news.title,
      subtitle: news.subtitle,
      excerpt: news.excerpt,
      content: news.content as Prisma.InputJsonValue,
      editedById,
      changeSummary,
    },
  });
}

export async function createNews(authorId: string, input: CreateNewsInput, req?: Request) {
  const slug = await ensureUniqueSlug(input.title, async (candidate) => {
    const existing = await prisma.news.findUnique({ where: { slug: candidate } });
    return Boolean(existing);
  });

  const news = await prisma.news.create({
    data: {
      title: sanitizePlainText(input.title),
      titleEn: input.titleEn ? sanitizePlainText(input.titleEn) : undefined,
      subtitle: input.subtitle ? sanitizePlainText(input.subtitle) : undefined,
      subtitleEn: input.subtitleEn ? sanitizePlainText(input.subtitleEn) : undefined,
      excerpt: sanitizePlainText(input.excerpt),
      excerptEn: input.excerptEn ? sanitizePlainText(input.excerptEn) : undefined,
      content: sanitizeContentBlocks(input.content) as Prisma.InputJsonValue,
      contentEn: input.contentEn ? (sanitizeContentBlocks(input.contentEn) as Prisma.InputJsonValue) : undefined,
      coverImage: input.coverImage,
      coverImageAlt: input.coverImageAlt,
      coverImageAltEn: input.coverImageAltEn,
      slug,
      categoryId: input.categoryId,
      authorId,
      format: input.format ?? "article",
      isFeatured: input.isFeatured ?? false,
      isBreaking: input.isBreaking ?? false,
      isHighlighted: input.isHighlighted ?? false,
      allowComments: input.allowComments ?? true,
      visibility: input.visibility ?? "PUBLIC",
      readingTime: input.readingTime ?? Math.max(3, Math.ceil(input.excerpt.split(" ").length / 40)),
      seoTitle: input.seoTitle,
      seoDescription: input.seoDescription,
      seoKeywords: input.seoKeywords,
      canonicalUrl: input.canonicalUrl,
      ogTitle: input.ogTitle,
      ogDescription: input.ogDescription,
      ogImage: input.ogImage,
      robotsIndex: input.robotsIndex ?? true,
      robotsFollow: input.robotsFollow ?? true,
      publishedAt: input.publishedAt ? new Date(input.publishedAt) : undefined,
      tags: input.tagIds?.length ? { create: input.tagIds.map((tagId) => ({ tagId })) } : undefined,
    },
    include,
  });

  await recordAudit({ req, action: "CREATE", module: "news", entity: "News", entityId: news.id, newData: { title: news.title } });
  return serializeAdmin(news);
}

export async function updateNews(id: string, input: UpdateNewsInput, editedById: string, req?: Request) {
  const existing = await prisma.news.findFirst({ where: { id, deletedAt: null }, include });
  if (!existing) throw AppError.notFound("Notícia não encontrada.");

  await snapshotVersion(existing, editedById, "Edição de conteúdo");

  const data: Prisma.NewsUpdateInput = {};
  if (input.title !== undefined) data.title = sanitizePlainText(input.title);
  if (input.titleEn !== undefined) data.titleEn = input.titleEn ? sanitizePlainText(input.titleEn) : null;
  if (input.subtitle !== undefined) data.subtitle = sanitizePlainText(input.subtitle);
  if (input.subtitleEn !== undefined) data.subtitleEn = input.subtitleEn ? sanitizePlainText(input.subtitleEn) : null;
  if (input.excerpt !== undefined) data.excerpt = sanitizePlainText(input.excerpt);
  if (input.excerptEn !== undefined) data.excerptEn = input.excerptEn ? sanitizePlainText(input.excerptEn) : null;
  if (input.content !== undefined) data.content = sanitizeContentBlocks(input.content) as Prisma.InputJsonValue;
  if (input.contentEn !== undefined) data.contentEn = input.contentEn ? (sanitizeContentBlocks(input.contentEn) as Prisma.InputJsonValue) : Prisma.DbNull;
  if (input.coverImage !== undefined) data.coverImage = input.coverImage;
  if (input.coverImageAlt !== undefined) data.coverImageAlt = input.coverImageAlt;
  if (input.coverImageAltEn !== undefined) data.coverImageAltEn = input.coverImageAltEn;
  if (input.categoryId !== undefined) data.category = { connect: { id: input.categoryId } };
  if (input.format !== undefined) data.format = input.format;
  if (input.isFeatured !== undefined) data.isFeatured = input.isFeatured;
  if (input.isBreaking !== undefined) data.isBreaking = input.isBreaking;
  if (input.isHighlighted !== undefined) data.isHighlighted = input.isHighlighted;
  if (input.allowComments !== undefined) data.allowComments = input.allowComments;
  if (input.visibility !== undefined) data.visibility = input.visibility;
  if (input.readingTime !== undefined) data.readingTime = input.readingTime;
  if (input.seoTitle !== undefined) data.seoTitle = input.seoTitle;
  if (input.seoDescription !== undefined) data.seoDescription = input.seoDescription;
  if (input.seoKeywords !== undefined) data.seoKeywords = input.seoKeywords;
  if (input.canonicalUrl !== undefined) data.canonicalUrl = input.canonicalUrl;
  if (input.ogTitle !== undefined) data.ogTitle = input.ogTitle;
  if (input.ogDescription !== undefined) data.ogDescription = input.ogDescription;
  if (input.ogImage !== undefined) data.ogImage = input.ogImage;
  if (input.robotsIndex !== undefined) data.robotsIndex = input.robotsIndex;
  if (input.robotsFollow !== undefined) data.robotsFollow = input.robotsFollow;
  if (input.publishedAt !== undefined) data.publishedAt = input.publishedAt ? new Date(input.publishedAt) : null;

  if (input.tagIds !== undefined) {
    await prisma.newsTag.deleteMany({ where: { newsId: id } });
    data.tags = input.tagIds.length ? { create: input.tagIds.map((tagId) => ({ tagId })) } : undefined;
  }

  const updated = await prisma.news.update({ where: { id }, data, include });
  const publishedAtChanged = input.publishedAt !== undefined && existing.publishedAt?.toISOString() !== updated.publishedAt?.toISOString();
  await recordAudit({
    req,
    action: publishedAtChanged ? "UPDATE_PUBLISHED_AT" : "UPDATE",
    module: "news",
    entity: "News",
    entityId: id,
    oldData: publishedAtChanged ? { title: existing.title, publishedAt: existing.publishedAt } : { title: existing.title },
    newData: publishedAtChanged ? { title: updated.title, publishedAt: updated.publishedAt } : { title: updated.title },
  });
  return serializeAdmin(updated);
}

async function transition(
  id: string,
  allowedFrom: string[],
  data: Prisma.NewsUpdateInput,
  action: string,
  req?: Request
) {
  const news = await prisma.news.findFirst({ where: { id, deletedAt: null } });
  if (!news) throw AppError.notFound("Notícia não encontrada.");
  if (!allowedFrom.includes(news.status)) {
    throw AppError.badRequest(`Não é possível executar esta acção a partir do estado actual (${news.status}).`);
  }
  const updated = await prisma.news.update({ where: { id }, data, include });
  await recordAudit({ req, action, module: "news", entity: "News", entityId: id, oldData: { status: news.status }, newData: { status: updated.status } });
  return serializeAdmin(updated);
}

export const submitForReview = async (id: string, req?: Request) => {
  const news = await transition(id, ["DRAFT", "REJECTED"], { status: "UNDER_REVIEW", rejectionReason: null }, "SUBMIT_REVIEW", req);
  await notifyUsersWithPermission(
    ["news.approve"],
    "Notícia enviada para revisão",
    `"${news.title}" aguarda a sua revisão.`,
    `/admin/news/${news.id}`
  );
  return news;
};

export const approveNews = (id: string, reviewerId: string, req?: Request) =>
  transition(id, ["UNDER_REVIEW"], { status: "APPROVED", reviewer: { connect: { id: reviewerId } } }, "APPROVE", req);

export const rejectNews = (id: string, reviewerId: string, reason: string, req?: Request) =>
  transition(
    id,
    ["UNDER_REVIEW"],
    { status: "REJECTED", reviewer: { connect: { id: reviewerId } }, rejectionReason: reason },
    "REJECT",
    req
  );

// "DRAFT" is included alongside the formal review states so an editor/admin who
// holds `news.publish` can publish directly without being forced through the
// submit-review -> approve pipeline meant for newsroom roles that don't hold
// that permission (e.g. Jornalista) — the review states remain fully usable.
export async function publishNews(id: string, req?: Request) {
  const news = await prisma.news.findFirst({ where: { id, deletedAt: null } });
  if (!news) throw AppError.notFound("Notícia não encontrada.");
  // Preserve a manually-set editorial date (e.g. migrated historical articles) instead
  // of always stamping "now" — only default to the current date/time when none was set.
  const publishedAt = news.publishedAt ?? new Date();
  return transition(id, ["DRAFT", "APPROVED", "SCHEDULED", "UNPUBLISHED"], { status: "PUBLISHED", publishedAt }, "PUBLISH", req);
}

export const unpublishNews = (id: string, req?: Request) =>
  transition(id, ["PUBLISHED"], { status: "UNPUBLISHED" }, "UNPUBLISH", req);

export const archiveNews = (id: string, req?: Request) =>
  transition(id, ["PUBLISHED", "UNPUBLISHED", "APPROVED", "REJECTED"], { status: "ARCHIVED" }, "ARCHIVE", req);

export const scheduleNews = (id: string, scheduledAt: Date, req?: Request) =>
  transition(id, ["APPROVED"], { status: "SCHEDULED", scheduledAt }, "SCHEDULE", req);

export async function deleteNews(id: string, req?: Request) {
  const news = await prisma.news.findFirst({ where: { id, deletedAt: null } });
  if (!news) throw AppError.notFound("Notícia não encontrada.");
  await prisma.news.update({ where: { id }, data: { deletedAt: new Date() } });
  await recordAudit({ req, action: "DELETE", module: "news", entity: "News", entityId: id });
}

export async function duplicateNews(id: string, authorId: string, req?: Request) {
  const original = await prisma.news.findFirst({ where: { id, deletedAt: null }, include });
  if (!original) throw AppError.notFound("Notícia não encontrada.");

  const slug = await ensureUniqueSlug(`${original.title}-copia`, async (candidate) => {
    const existing = await prisma.news.findUnique({ where: { slug: candidate } });
    return Boolean(existing);
  });

  const duplicate = await prisma.news.create({
    data: {
      title: `${original.title} (cópia)`,
      subtitle: original.subtitle,
      excerpt: original.excerpt,
      content: original.content as Prisma.InputJsonValue,
      coverImage: original.coverImage,
      coverImageAlt: original.coverImageAlt,
      slug,
      categoryId: original.categoryId,
      authorId,
      format: original.format,
      status: "DRAFT",
      tags: original.tags.length ? { create: original.tags.map((t) => ({ tagId: t.tagId })) } : undefined,
    },
    include,
  });

  await recordAudit({ req, action: "DUPLICATE", module: "news", entity: "News", entityId: duplicate.id, oldData: { fromId: id } });
  return serializeAdmin(duplicate);
}

export async function getNewsVersions(newsId: string) {
  return prisma.newsVersion.findMany({
    where: { newsId },
    include: { editedBy: { select: { id: true, name: true } } },
    orderBy: { version: "desc" },
  });
}

// ── Public convenience queries (mirroring the frontend NewsRepository contract) ──

export async function getLatest(limit = 12, excludeIds: string[] = [], locale: Locale = "pt") {
  const where = excludeIds.length ? { ...publishedWhere(), id: { notIn: excludeIds } } : publishedWhere();
  return prisma.news.findMany({ where, include, orderBy: { publishedAt: "desc" }, take: limit }).then((r) => r.map((n) => serializePublic(n, locale)));
}

export async function getFeatured(limit = 6, locale: Locale = "pt") {
  return prisma.news
    .findMany({ where: { ...publishedWhere(), isFeatured: true }, include, orderBy: { publishedAt: "desc" }, take: limit })
    .then((r) => r.map((n) => serializePublic(n, locale)));
}

export async function getBreaking(limit = 5, locale: Locale = "pt") {
  return prisma.news
    .findMany({ where: { ...publishedWhere(), isBreaking: true }, include, orderBy: { publishedAt: "desc" }, take: limit })
    .then((r) => r.map((n) => serializePublic(n, locale)));
}

export async function getMostRead(limit = 8, excludeIds: string[] = [], locale: Locale = "pt") {
  const where = excludeIds.length ? { ...publishedWhere(), id: { notIn: excludeIds } } : publishedWhere();
  return prisma.news.findMany({ where, include, orderBy: { viewsCount: "desc" }, take: limit }).then((r) => r.map((n) => serializePublic(n, locale)));
}

export async function getByFormat(format: string, limit = 8, excludeIds: string[] = [], locale: Locale = "pt") {
  const where = { ...publishedWhere(), format, ...(excludeIds.length ? { id: { notIn: excludeIds } } : {}) };
  return prisma.news.findMany({ where, include, orderBy: { publishedAt: "desc" }, take: limit }).then((r) => r.map((n) => serializePublic(n, locale)));
}

export async function getByCategory(categorySlug: string, limit = 8, locale: Locale = "pt") {
  return prisma.news
    .findMany({ where: { ...publishedWhere(), category: { slug: categorySlug } }, include, orderBy: { publishedAt: "desc" }, take: limit })
    .then((r) => r.map((n) => serializePublic(n, locale)));
}

export async function getRelated(newsId: string, limit = 4, locale: Locale = "pt") {
  const source = await prisma.news.findUnique({ where: { id: newsId } });
  if (!source) return [];
  return prisma.news
    .findMany({
      where: { ...publishedWhere(), categoryId: source.categoryId, id: { not: newsId } },
      include,
      orderBy: { publishedAt: "desc" },
      take: limit,
    })
    .then((r) => r.map((n) => serializePublic(n, locale)));
}

export async function getAdjacent(newsId: string, locale: Locale = "pt") {
  const source = await prisma.news.findUnique({ where: { id: newsId } });
  if (!source || !source.publishedAt) return { previous: null, next: null };

  const [previous, next] = await Promise.all([
    prisma.news.findFirst({
      where: { ...publishedWhere(), publishedAt: { lt: source.publishedAt } },
      include,
      orderBy: { publishedAt: "desc" },
    }),
    prisma.news.findFirst({
      where: { ...publishedWhere(), publishedAt: { gt: source.publishedAt } },
      include,
      orderBy: { publishedAt: "asc" },
    }),
  ]);

  return { previous: previous ? serializePublic(previous, locale) : null, next: next ? serializePublic(next, locale) : null };
}

/** Fetches multiple published News rows by id, for modules (e.g. latest-news
 * curation) that store only a newsId reference and need live content. Rows
 * for ids that are missing/unpublished/deleted are silently omitted. */
export async function getByIds(ids: string[], locale: Locale = "pt") {
  if (ids.length === 0) return [];
  const rows = await prisma.news.findMany({ where: { ...publishedWhere(), id: { in: ids } }, include });
  return rows.map((n) => serializePublic(n, locale));
}

export async function searchNews(query: string, limit = 10, locale: Locale = "pt") {
  if (!query.trim()) return [];
  return prisma.news
    .findMany({
      where: {
        ...publishedWhere(),
        OR: [
          { title: { contains: query } },
          { excerpt: { contains: query } },
          { category: { name: { contains: query } } },
          { tags: { some: { tag: { name: { contains: query } } } } },
          ...(locale === "en"
            ? [
                { titleEn: { contains: query } },
                { excerptEn: { contains: query } },
              ]
            : []),
        ],
      },
      include,
      orderBy: { publishedAt: "desc" },
      take: limit,
    })
    .then((r) => r.map((n) => serializePublic(n, locale)));
}
