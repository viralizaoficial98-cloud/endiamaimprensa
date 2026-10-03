import { getTranslations } from "next-intl/server";
import type { EndiamaBanner, HeroSlide, News } from "@/domain/entities";
import { getAudioHighlights } from "./audio-use-cases";
import { getActiveBanners } from "./banner-use-cases";
import { getLatestDocuments } from "./document-use-cases";
import { getUpcomingEvents } from "./event-use-cases";
import { getFeaturedNews, getLatestNews, getMostReadNews, getNewsByFormat } from "./news-use-cases";
import { getAllPartners } from "./partner-use-cases";
import { getLatestVideos } from "./video-use-cases";

/** The homepage must keep rendering even if the API is fully unreachable — every
 * section degrades to an empty list instead of taking down the whole page. */
export function safe<T>(promise: Promise<T[]>): Promise<T[]> {
  return promise.catch(() => []);
}

function newsToHeroSlide(news: News, readArticleLabel: string): HeroSlide {
  return {
    id: news.id,
    categoryName: news.category.name,
    title: news.title,
    excerpt: news.excerpt,
    coverImage: news.coverImage,
    coverImageAlt: news.coverImageAlt,
    publishedAt: news.publishedAt,
    readTimeMinutes: news.readTimeMinutes,
    isFeaturedBadge: news.isFeatured,
    ctaLabel: readArticleLabel,
    ctaHref: `/noticia/${news.slug}`,
  };
}

function bannerToHeroSlide(banner: EndiamaBanner, learnMoreLabel: string): HeroSlide {
  return {
    id: banner.id,
    categoryName: banner.category?.name,
    title: banner.title,
    excerpt: banner.description ?? banner.subtitle,
    coverImage: banner.image,
    coverImageAlt: banner.imageAlt,
    ctaLabel: banner.buttonText || learnMoreLabel,
    ctaHref: banner.buttonUrl || (banner.relatedNews ? `/noticia/${banner.relatedNews.slug}` : "#"),
    secondaryCtaLabel: banner.secondaryButtonText,
    secondaryCtaHref: banner.secondaryButtonUrl,
  };
}

/** Only what the Hero needs — kept tiny and awaited directly in the page so
 * the LCP content never waits on the rest of the homepage's ~10 unrelated
 * queries (most-read, videos, documents, events, ...). The breaking-news bar
 * is fetched separately via getLatestNewsSection() (admin-curated "Última
 * Hora"), not as part of this.
 *
 * Administração > Banners is the single source of truth for every slide of
 * the main Hero/Slider, including the first one — when at least one active
 * Banner exists, ALL slides come from there, in the admin's own `order`.
 * Nothing here picks "the latest article" or "Destaque" news over what the
 * admin configured.
 *
 * Only when NO banner is configured at all does this fall back to an
 * auto-curated set (latest published article + News marked "Destaque") so
 * the homepage is never blank on a fresh install — that fallback is exactly
 * what it was before Banners existed for this page, not a competing source
 * once Banners are in use. */
export async function getHeroData(locale = "pt") {
  const [banners, t] = await Promise.all([safe(getActiveBanners()), getTranslations("common")]);

  if (banners.length > 0) {
    const heroSlides = banners.slice(0, 6).map((b) => bannerToHeroSlide(b, t("readMore")));
    const excludeIds = banners.map((b) => b.relatedNews?.id).filter((id): id is string => Boolean(id));
    return { heroSlides, excludeIds };
  }

  const latestNews = await safe(getLatestNews(1, undefined, locale));
  const primary = latestNews[0];
  const primarySlide = primary ? newsToHeroSlide(primary, t("readArticle")) : null;

  const featuredNews = await safe(getFeaturedNews(6, locale));
  const rest = featuredNews.filter((n) => n.id !== primary?.id).slice(0, 5);
  const restSlides = rest.map((n) => newsToHeroSlide(n, t("readArticle")));
  let excludeIds = featuredNews.map((n) => n.id);

  const heroSlides = primarySlide ? [primarySlide, ...restSlides] : restSlides;
  if (primary) excludeIds = [...excludeIds, primary.id];

  return { heroSlides, excludeIds };
}

/**
 * Each of these is fetched independently (not behind one shared Promise.all)
 * so that HomepageBody can give every section its own Suspense boundary —
 * a fast query (e.g. most-read) streams to the browser as soon as it's ready
 * instead of waiting behind a slower one (e.g. events, partners).
 */
export function getMostReadSectionData(excludeIds: string[], locale = "pt") {
  return safe(getMostReadNews(8, excludeIds, locale));
}

export function getVideosSectionData() {
  return safe(getLatestVideos(8));
}

export function getAudioHighlightsSectionData() {
  return safe(getAudioHighlights(10));
}

export function getDocumentsSectionData() {
  return safe(getLatestDocuments(5));
}

export function getEventsSectionData() {
  return safe(getUpcomingEvents(5));
}

export function getPartnersSectionData() {
  return safe(getAllPartners());
}

export function getInfographicsSectionData(excludeIds: string[], locale = "pt") {
  return safe(getNewsByFormat("infographic", 4, excludeIds, locale));
}

export function getReportsSectionData(excludeIds: string[], locale = "pt") {
  return safe(getNewsByFormat("report", 4, excludeIds, locale));
}

export function getInternationalSectionData(excludeIds: string[], locale = "pt") {
  return safe(getNewsByFormat("international", 6, excludeIds, locale));
}
