import { env } from "../../config/env";
import { logger } from "../../config/logger";
import { prisma } from "../../config/prisma";
import { AppError } from "../../common/app-error";
import { toSlug } from "../../utils/slug";

/** Only the fields actually used — `_fields` cuts the WordPress response from
 * ~2.4MB to ~120KB per 100-post page (measured against the real production
 * site), which matters because that site is slow (7-13s per page even with
 * this trimming) and we fetch the whole category on every cache refresh. */
const WP_FIELDS = "id,date,link,title,excerpt,jetpack_featured_media_url";
const WP_PER_PAGE = 100;
const WP_MAX_PAGES = 50; // safety cap — the real archive is ~6 pages (577 posts); this just bounds a runaway loop.
const WP_TIMEOUT_MS = 30_000; // the source has been observed taking 7-13s per page; leave real margin.

interface WpRawPost {
  id: number;
  date: string;
  link: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  jetpack_featured_media_url?: string;
}

export interface HistoricalPost {
  id: number;
  title: string;
  excerpt: string;
  publishedAt: string;
  sourceUrl: string;
  image: { url: string; alt: string } | null;
  /** Lowercased, tag-stripped title+excerpt — kept only for server-side
   * keyword matching, never sent to the client. */
  searchText: string;
}

const HTML_ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&hellip;": "…",
  "&nbsp;": " ",
  "&quot;": '"',
  "&#8220;": "“",
  "&#8221;": "”",
  "&#8216;": "‘",
  "&#8217;": "’",
  "&#8211;": "–",
  "&#8212;": "—",
  "&#039;": "'",
};

function decodeEntities(text: string): string {
  return text.replace(/&#?\w+;/g, (entity) => HTML_ENTITIES[entity] ?? entity);
}

function stripHtml(html: string): string {
  return decodeEntities(html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ")).trim();
}

async function fetchWpPage(page: number): Promise<{ posts: WpRawPost[]; totalPages: number }> {
  const url =
    `${env.wordpressArchiveUrl}/wp-json/wp/v2/posts` +
    `?categories=${env.wordpressArchiveCategoryId}&per_page=${WP_PER_PAGE}&page=${page}&_fields=${WP_FIELDS}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), WP_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`WordPress respondeu ${response.status} em ${url}`);
    const posts = (await response.json()) as WpRawPost[];
    const totalPages = Number(response.headers.get("x-wp-totalpages") ?? 1) || 1;
    return { posts, totalPages };
  } finally {
    clearTimeout(timeout);
  }
}

function mapPost(raw: WpRawPost): HistoricalPost {
  const title = decodeEntities(raw.title.rendered);
  const excerpt = stripHtml(raw.excerpt.rendered);
  return {
    id: raw.id,
    title,
    excerpt,
    publishedAt: raw.date,
    sourceUrl: raw.link,
    image: raw.jetpack_featured_media_url ? { url: raw.jetpack_featured_media_url, alt: title } : null,
    searchText: `${title} ${excerpt}`.toLowerCase(),
  };
}

async function fetchAllHistoricalPosts(): Promise<HistoricalPost[]> {
  const first = await fetchWpPage(1);
  const totalPages = Math.min(first.totalPages, WP_MAX_PAGES);
  const remainingPages = Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) => i + 2);

  // The pages are independent reads against a slow source — fetching the
  // (small, ~5-6) remaining pages concurrently instead of one-by-one turns a
  // ~70-90s sequential refresh into one dominated by the single slowest page.
  const rest = await Promise.all(
    remainingPages.map((page) =>
      fetchWpPage(page).catch((err) => {
        logger.warn({ err, page }, "Falha ao obter uma página do arquivo histórico do WordPress — a continuar com as restantes.");
        return { posts: [] as WpRawPost[], totalPages };
      })
    )
  );

  return [...first.posts, ...rest.flatMap((r) => r.posts)].map(mapPost);
}

/** Titles already published natively in this portal, normalised the same way
 * as `ensureUniqueSlug` — used to exclude historical posts that would
 * otherwise show up twice (once as native content, once from the archive). */
async function getNativeNewsTitleSlugs(): Promise<Set<string>> {
  const rows = await prisma.news.findMany({ select: { title: true } });
  return new Set(rows.map((r) => toSlug(r.title)));
}

interface ArchiveCache {
  posts: HistoricalPost[];
  excludedTitleSlugs: Set<string>;
  expiresAt: number;
}

let cache: ArchiveCache | null = null;
let refreshing: Promise<ArchiveCache> | null = null;

async function refreshCache(): Promise<ArchiveCache> {
  const [posts, excludedTitleSlugs] = await Promise.all([fetchAllHistoricalPosts(), getNativeNewsTitleSlugs()]);
  const fresh: ArchiveCache = { posts, excludedTitleSlugs, expiresAt: Date.now() + env.wordpressArchiveCacheMinutes * 60_000 };
  cache = fresh;
  return fresh;
}

async function getArchive(): Promise<ArchiveCache> {
  if (cache && cache.expiresAt > Date.now()) return cache;
  if (refreshing) return refreshing;

  refreshing = refreshCache().finally(() => {
    refreshing = null;
  });

  try {
    return await refreshing;
  } catch (err) {
    // A stale cache is still useful (this is a historical, rarely-changing
    // archive) — only fail the request outright if we have nothing at all.
    if (cache) {
      logger.warn({ err }, "Falha ao actualizar o arquivo histórico do WordPress — a servir a cópia em cache anterior.");
      return cache;
    }
    throw AppError.internal("O arquivo histórico de notícias está indisponível de momento. Tente novamente dentro de alguns minutos.");
  }
}

export interface HistoricalArchiveQuery {
  page: number;
  limit: number;
  search?: string;
  year?: number;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface HistoricalArchiveResult {
  data: Omit<HistoricalPost, "searchText">[];
  total: number;
}

export async function searchHistoricalArchive(query: HistoricalArchiveQuery): Promise<HistoricalArchiveResult> {
  const { posts, excludedTitleSlugs } = await getArchive();

  const keyword = query.search?.toLowerCase().trim();
  const filtered = posts.filter((post) => {
    if (excludedTitleSlugs.has(toSlug(post.title))) return false;
    if (keyword && !post.searchText.includes(keyword)) return false;
    const publishedAt = new Date(post.publishedAt);
    if (query.year !== undefined && publishedAt.getFullYear() !== query.year) return false;
    if (query.dateFrom && publishedAt < query.dateFrom) return false;
    if (query.dateTo && publishedAt > query.dateTo) return false;
    return true;
  });

  filtered.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  const start = (query.page - 1) * query.limit;
  const page = filtered.slice(start, start + query.limit).map(({ searchText: _searchText, ...rest }) => rest);

  return { data: page, total: filtered.length };
}
