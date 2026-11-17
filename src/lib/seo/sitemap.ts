import { listAudios } from "@/application/use-cases/audio-use-cases";
import { getAllCategories } from "@/application/use-cases/category-use-cases";
import { getArchivedEvents } from "@/application/use-cases/event-use-cases";
import { getGalleryAlbumBySlug, listGalleryAlbums } from "@/application/use-cases/gallery-use-cases";
import { getLatestInterviews } from "@/application/use-cases/interview-use-cases";
import { listNews } from "@/application/use-cases/news-use-cases";
import { getAllVideos } from "@/application/use-cases/video-use-cases";
import type { News, NewsBlock } from "@/domain/entities";
import type { Paginated } from "@/domain/shared/pagination";
import { resolveMediaUrl } from "@/lib/media";
import { videoSourceUrls } from "@/lib/seo/json-ld";
import { absoluteUrl, isOwnUrl, plainText, SITE_LANGUAGE, SITE_NAME, truncate } from "@/lib/site";

/**
 * Data + XML for the portal's sitemaps. Everything is read live from the
 * public API through the same tagged fetch cache as the pages, so when the
 * admin publishes / edits / removes content (which already calls
 * /api/revalidate with that resource's tag) the sitemaps reflect it on the
 * very next request — there is no separate file to regenerate.
 */

// Search engine limits (sitemaps.org / Google): 50 000 URLs per file, 1 000 per Google News sitemap.
export const MAX_URLS_PER_SITEMAP = 50_000;
export const MAX_GOOGLE_NEWS_URLS = 1_000;
const GOOGLE_NEWS_WINDOW_MS = 48 * 60 * 60 * 1000;

const PAGE_SIZE = 50;
const MAX_PAGES = Math.ceil(MAX_URLS_PER_SITEMAP / PAGE_SIZE);

/* ────────────────────────────── XML helpers ────────────────────────────── */

export function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    // Control characters are not allowed in XML 1.0.
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
}

export function isoDate(value?: string | null): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

export function xmlResponse(body: string): Response {
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n${body}`, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      // Short shared cache: a new article appears within minutes even behind a proxy.
      "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
      "X-Robots-Tag": "noindex",
    },
  });
}

export interface SitemapImage {
  loc: string;
}

export interface SitemapVideo {
  thumbnailLoc: string;
  title: string;
  description: string;
  contentLoc?: string;
  playerLoc?: string;
  durationSeconds?: number;
  publicationDate?: string;
}

export interface SitemapEntry {
  loc: string;
  lastmod?: string;
  images?: SitemapImage[];
  videos?: SitemapVideo[];
}

function renderImage(image: SitemapImage): string {
  return `<image:image><image:loc>${xmlEscape(image.loc)}</image:loc></image:image>`;
}

function renderVideo(video: SitemapVideo): string {
  return [
    "<video:video>",
    `<video:thumbnail_loc>${xmlEscape(video.thumbnailLoc)}</video:thumbnail_loc>`,
    `<video:title>${xmlEscape(truncate(video.title, 100))}</video:title>`,
    `<video:description>${xmlEscape(truncate(video.description, 2048))}</video:description>`,
    video.contentLoc ? `<video:content_loc>${xmlEscape(video.contentLoc)}</video:content_loc>` : "",
    video.playerLoc ? `<video:player_loc>${xmlEscape(video.playerLoc)}</video:player_loc>` : "",
    video.durationSeconds && video.durationSeconds > 0 && video.durationSeconds <= 28_800
      ? `<video:duration>${Math.round(video.durationSeconds)}</video:duration>`
      : "",
    video.publicationDate ? `<video:publication_date>${video.publicationDate}</video:publication_date>` : "",
    "<video:family_friendly>yes</video:family_friendly>",
    "</video:video>",
  ].join("");
}

export function renderUrlset(entries: SitemapEntry[]): string {
  const withImages = entries.some((entry) => entry.images?.length);
  const withVideos = entries.some((entry) => entry.videos?.length);
  const namespaces = [
    'xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    withImages ? 'xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"' : "",
    withVideos ? 'xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"' : "",
  ]
    .filter(Boolean)
    .join(" ");
  const urls = dedupe(entries)
    .slice(0, MAX_URLS_PER_SITEMAP)
    .map((entry) =>
      [
        "<url>",
        `<loc>${xmlEscape(entry.loc)}</loc>`,
        entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : "",
        // Google accepts at most 1 000 images per page entry.
        ...(entry.images ?? []).slice(0, 1000).map(renderImage),
        ...(entry.videos ?? []).map(renderVideo),
        "</url>",
      ].join("")
    );
  return `<urlset ${namespaces}>\n${urls.join("\n")}\n</urlset>`;
}

export function renderSitemapIndex(sitemaps: { loc: string; lastmod?: string }[]): string {
  const items = sitemaps.map(
    (sitemap) => `<sitemap><loc>${xmlEscape(sitemap.loc)}</loc>${sitemap.lastmod ? `<lastmod>${sitemap.lastmod}</lastmod>` : ""}</sitemap>`
  );
  return `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items.join("\n")}\n</sitemapindex>`;
}

export interface GoogleNewsEntry {
  loc: string;
  title: string;
  publicationDate: string;
}

export function renderGoogleNewsUrlset(entries: GoogleNewsEntry[]): string {
  const urls = entries.slice(0, MAX_GOOGLE_NEWS_URLS).map((entry) =>
    [
      "<url>",
      `<loc>${xmlEscape(entry.loc)}</loc>`,
      "<news:news>",
      `<news:publication><news:name>${xmlEscape(SITE_NAME)}</news:name><news:language>${SITE_LANGUAGE}</news:language></news:publication>`,
      `<news:publication_date>${entry.publicationDate}</news:publication_date>`,
      `<news:title>${xmlEscape(entry.title)}</news:title>`,
      "</news:news>",
      "</url>",
    ].join("")
  );
  return `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n${urls.join("\n")}\n</urlset>`;
}

function dedupe(entries: SitemapEntry[]): SitemapEntry[] {
  const seen = new Set<string>();
  return entries.filter((entry) => (seen.has(entry.loc) ? false : (seen.add(entry.loc), true)));
}

/* ────────────────────────────── Data loading ───────────────────────────── */

async function collectPages<T>(fetchPage: (page: number) => Promise<Paginated<T>>): Promise<T[]> {
  const items: T[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const result = await fetchPage(page);
    items.push(...result.data);
    if (!result.pagination.hasNextPage || result.data.length === 0) break;
  }
  return items;
}

/** Runs async work over a list with bounded concurrency (avoids flooding the API). */
async function mapWithConcurrency<T, R>(items: T[], limit: number, worker: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function run() {
    while (next < items.length) {
      const index = next++;
      results[index] = await worker(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

/** Editorial fallback photos are generic, not content images — keep them out of image sitemaps. */
function isContentImage(url?: string | null): url is string {
  return Boolean(url) && !url!.includes("/images/fallbacks/");
}

function newsPath(news: News): string {
  return `/noticia/${news.slug}`;
}

/** A news article belongs in the sitemaps only if it is indexable and canonical to its own URL. */
export function isIndexableNews(news: News): boolean {
  if (news.seo && !news.seo.index) return false;
  const canonical = news.seo?.canonicalUrl;
  if (canonical) {
    const ownUrl = absoluteUrl(newsPath(news));
    const resolved = absoluteUrl(canonical);
    if (!isOwnUrl(resolved) || resolved.replace(/\/$/, "") !== ownUrl) return false;
  }
  return true;
}

export async function getAllPublishedNews(): Promise<News[]> {
  const all = await collectPages((page) => listNews({ page, limit: PAGE_SIZE, sortBy: "publishedAt", sortOrder: "desc" }, "pt"));
  return all.filter(isIndexableNews);
}

/** Only the newest pages, stopping as soon as articles fall outside the Google News window. */
export async function getRecentPublishedNews(now = Date.now()): Promise<News[]> {
  const recent: News[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const result = await listNews({ page, limit: PAGE_SIZE, sortBy: "publishedAt", sortOrder: "desc" }, "pt");
    recent.push(...result.data);
    const oldest = result.data[result.data.length - 1];
    const oldestTime = oldest ? new Date(oldest.publishedAt).getTime() : 0;
    if (!result.pagination.hasNextPage || now - oldestTime > GOOGLE_NEWS_WINDOW_MS || recent.length >= MAX_GOOGLE_NEWS_URLS) break;
  }
  return recent.filter(isIndexableNews);
}

function blockImages(blocks: NewsBlock[]): string[] {
  const urls: string[] = [];
  for (const block of blocks) {
    if (block.type === "image" && block.content) urls.push(block.content);
    if (block.type === "gallery") for (const image of block.images ?? []) urls.push(image.url);
  }
  return urls;
}

function toAbsoluteImages(urls: Array<string | undefined | null>): SitemapImage[] {
  const unique = new Set<string>();
  for (const url of urls) if (isContentImage(url)) unique.add(absoluteUrl(resolveMediaUrl(url)));
  return Array.from(unique, (loc) => ({ loc }));
}

export function newsEntries(newsList: News[]): SitemapEntry[] {
  return newsList.map((news) => ({
    loc: absoluteUrl(newsPath(news)),
    lastmod: isoDate(news.updatedAt ?? news.publishedAt),
    images: toAbsoluteImages([news.coverImage, news.seo?.ogImage, ...blockImages(news.blocks)]),
  }));
}

export function googleNewsEntries(newsList: News[], now = Date.now()): GoogleNewsEntry[] {
  return newsList
    .filter((news) => {
      const published = new Date(news.publishedAt).getTime();
      return !Number.isNaN(published) && now - published <= GOOGLE_NEWS_WINDOW_MS && published <= now;
    })
    .map((news) => ({
      loc: absoluteUrl(newsPath(news)),
      title: plainText(news.title),
      publicationDate: isoDate(news.publishedAt)!,
    }));
}

/** Listing and institutional pages that exist in the app router. */
const STATIC_PATHS = [
  "/",
  "/noticias",
  "/entrevistas",
  "/eventos",
  "/documentos",
  "/videos",
  "/galeria",
  "/audios",
  "/clipping",
  "/arquivo-historico",
  "/contacto",
  "/politica-de-privacidade",
  "/termos-de-utilizacao",
];

/** Most recent real date among a list, so listing pages get an honest <lastmod>. */
function latest(dates: Array<string | undefined>): string | undefined {
  const times = dates.map((d) => (d ? new Date(d).getTime() : NaN)).filter((t) => !Number.isNaN(t));
  return times.length ? new Date(Math.max(...times)).toISOString() : undefined;
}

export async function pageEntries(): Promise<SitemapEntry[]> {
  const [categories, latestNews] = await Promise.all([
    getAllCategories("pt").catch(() => []),
    listNews({ page: 1, limit: 1, sortBy: "publishedAt", sortOrder: "desc" }, "pt").catch(() => null),
  ]);
  const newestNews = latestNews?.data[0];
  const newsLastmod = isoDate(newestNews?.updatedAt ?? newestNews?.publishedAt);

  return [
    ...STATIC_PATHS.map((path) => ({
      loc: absoluteUrl(path),
      lastmod: path === "/" || path === "/noticias" ? newsLastmod : undefined,
    })),
    ...categories.map((category) => ({ loc: absoluteUrl(`/categoria/${category.slug}`) })),
  ];
}

export async function interviewEntries(): Promise<SitemapEntry[]> {
  const interviews = await getLatestInterviews(MAX_URLS_PER_SITEMAP);
  return interviews.map((interview) => ({
    loc: absoluteUrl(`/entrevistas/${interview.slug}`),
    lastmod: isoDate(interview.updatedAt ?? interview.datePublished),
    images: toAbsoluteImages([interview.coverImage, interview.intervieweePhoto, ...blockImages(interview.blocks)]),
  }));
}

export async function eventEntries(): Promise<SitemapEntry[]> {
  // The public events endpoint caps the list at its 60 most recent events.
  const events = await getArchivedEvents(60);
  return events
    .filter((event) => event.status !== "DRAFT")
    .map((event) => ({
      loc: absoluteUrl(`/eventos/${event.slug}`),
      lastmod: isoDate(event.updatedAt),
      images: toAbsoluteImages([event.imageUrl]),
    }));
}

export async function audioEntries(): Promise<SitemapEntry[]> {
  const audios = await collectPages((page) => listAudios({ page, limit: PAGE_SIZE }));
  return audios.map((audio) => ({
    loc: absoluteUrl(`/audios/${audio.slug}`),
    lastmod: isoDate(audio.updatedAt ?? audio.datePublished),
    images: toAbsoluteImages([audio.coverImage]),
  }));
}

const MAX_GALLERY_ALBUMS_WITH_PHOTOS = 500;

export async function galleryEntries(): Promise<SitemapEntry[]> {
  const albums = await collectPages((page) => listGalleryAlbums({ page, limit: PAGE_SIZE }));
  // Photos are only returned by the album detail endpoint (cached per album).
  const details = await mapWithConcurrency(albums.slice(0, MAX_GALLERY_ALBUMS_WITH_PHOTOS), 4, (album) =>
    getGalleryAlbumBySlug(album.slug).catch(() => null)
  );
  return albums.map((album, index) => ({
    loc: absoluteUrl(`/galeria/${album.slug}`),
    lastmod: isoDate(album.updatedAt),
    images: toAbsoluteImages([album.coverImage, ...(details[index]?.photos.map((photo) => photo.imageUrl) ?? [])]),
  }));
}

/* ─────────────────────────────── Videos ─────────────────────────────── */

function toSitemapVideo(source: {
  title: string;
  description?: string;
  thumbnail?: string;
  videoType?: Parameters<typeof videoSourceUrls>[0];
  videoUrl?: string;
  durationSeconds?: number;
  publishedAt?: string;
}): SitemapVideo | null {
  const { embedUrl, contentUrl } = videoSourceUrls(source.videoType, source.videoUrl);
  if (!source.thumbnail || (!embedUrl && !contentUrl)) return null;
  return {
    thumbnailLoc: absoluteUrl(resolveMediaUrl(source.thumbnail)),
    title: plainText(source.title),
    description: plainText(source.description) || plainText(source.title),
    contentLoc: contentUrl,
    playerLoc: embedUrl,
    durationSeconds: source.durationSeconds,
    publicationDate: isoDate(source.publishedAt),
  };
}

/**
 * Videos have no page of their own yet — they are published on /videos and
 * inside news articles, so each video is declared on the page that embeds it.
 */
export async function videoEntries(): Promise<SitemapEntry[]> {
  const [videos, newsList] = await Promise.all([getAllVideos(), getAllPublishedNews()]);

  const listing: SitemapEntry = {
    loc: absoluteUrl("/videos"),
    lastmod: latest(videos.map((video) => video.updatedAt ?? video.datePublished)),
    videos: videos
      .map((video) =>
        toSitemapVideo({
          title: video.title,
          description: video.description,
          thumbnail: video.thumbnailUrl,
          videoType: video.videoType,
          videoUrl: video.videoUrl,
          durationSeconds: video.durationSeconds,
          publishedAt: video.datePublished,
        })
      )
      .filter((video): video is SitemapVideo => Boolean(video)),
  };

  const articles: SitemapEntry[] = newsList
    .map((news) => ({
      loc: absoluteUrl(newsPath(news)),
      lastmod: isoDate(news.updatedAt ?? news.publishedAt),
      videos: news.blocks
        .filter((block) => block.type === "video")
        .map((block) =>
          toSitemapVideo({
            title: block.title || news.title,
            description: block.caption || news.excerpt,
            thumbnail: block.thumbnailUrl || news.coverImage,
            videoType: block.videoType,
            videoUrl: block.videoUrl,
            publishedAt: news.publishedAt,
          })
        )
        .filter((video): video is SitemapVideo => Boolean(video)),
    }))
    .filter((entry) => entry.videos.length > 0);

  return [...(listing.videos?.length ? [listing] : []), ...articles];
}
