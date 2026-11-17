import type {
  EndiamaAudio,
  EndiamaEvent,
  GalleryAlbum,
  Interview,
  News,
  NewsBlock,
  SocialLink,
  Video,
} from "@/domain/entities";
import { resolveMediaUrl } from "@/lib/media";
import {
  absoluteUrl,
  ORGANIZATION_LEGAL_NAME,
  ORGANIZATION_NAME,
  plainText,
  SITE_LOGO_PATH,
  SITE_NAME,
  SITE_URL,
  truncate,
} from "@/lib/site";

/**
 * Schema.org builders. Every value comes from real portal data (CMS records or
 * the identity already published on the site) — nothing is invented: optional
 * properties are simply omitted when the source field is empty.
 */

type JsonLdNode = Record<string, unknown>;

export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

const DESCRIPTION_LIMIT = 300;

function compact<T extends JsonLdNode>(node: T): T {
  return Object.fromEntries(
    Object.entries(node).filter(([, value]) => value !== undefined && value !== null && value !== "" && !(Array.isArray(value) && value.length === 0))
  ) as T;
}

function isoDate(value?: string | null): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

/** ISO 8601 duration (e.g. PT4M13S) from seconds; undefined when unknown. */
export function isoDuration(totalSeconds?: number | null): string | undefined {
  if (!totalSeconds || totalSeconds <= 0) return undefined;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `PT${hours ? `${hours}H` : ""}${minutes ? `${minutes}M` : ""}${seconds || (!hours && !minutes) ? `${seconds}S` : ""}`;
}

const publisherRef = { "@id": ORGANIZATION_ID };

export function organizationJsonLd(socialLinks: SocialLink[] = []): JsonLdNode {
  return compact({
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: ORGANIZATION_NAME,
    legalName: ORGANIZATION_LEGAL_NAME,
    url: SITE_URL,
    logo: { "@type": "ImageObject", url: absoluteUrl(SITE_LOGO_PATH), width: 1043, height: 239 },
    // Official profiles managed in the admin "Redes sociais" module; WhatsApp
    // links are contact channels, not profiles, so they are left out.
    sameAs: socialLinks.filter((link) => link.platform !== "WHATSAPP" && /^https?:\/\//.test(link.url)).map((link) => link.url),
  });
}

export function websiteJsonLd(): JsonLdNode {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: SITE_URL,
    name: SITE_NAME,
    inLanguage: "pt-AO",
    publisher: publisherRef,
  };
}

export interface BreadcrumbItem {
  name: string;
  /** Site-relative path; omit for the current page (last item). */
  path?: string;
}

export function breadcrumbJsonLd(items: BreadcrumbItem[]): JsonLdNode {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) =>
      compact({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: item.path ? absoluteUrl(item.path) : undefined,
      })
    ),
  };
}

function authorNode(name?: string | null): JsonLdNode {
  // A named CMS user is a real person; without one, the article is attributed
  // to the organisation itself rather than to an invented author.
  return name?.trim() ? { "@type": "Person", name: name.trim() } : publisherRef;
}

export function newsArticleJsonLd(news: News, canonicalUrl: string): JsonLdNode {
  const images = [news.seo?.ogImage, news.coverImage].filter((url): url is string => Boolean(url)).map((url) => absoluteUrl(url));
  return compact({
    "@type": "NewsArticle",
    "@id": `${canonicalUrl}#article`,
    mainEntityOfPage: { "@type": "WebPage", "@id": canonicalUrl },
    url: canonicalUrl,
    headline: truncate(news.title, 110),
    alternativeHeadline: news.subtitle ? plainText(news.subtitle) : undefined,
    description: truncate(news.seo?.description || news.excerpt, DESCRIPTION_LIMIT),
    image: Array.from(new Set(images)),
    datePublished: isoDate(news.publishedAt),
    dateModified: isoDate(news.updatedAt ?? news.publishedAt),
    author: [authorNode(news.author?.name)],
    publisher: publisherRef,
    articleSection: news.category?.name,
    keywords: news.tags.map((tag) => tag.name).join(", ") || undefined,
    inLanguage: "pt-AO",
    isPartOf: { "@id": WEBSITE_ID },
  });
}

export function interviewJsonLd(interview: Interview, canonicalUrl: string): JsonLdNode {
  return compact({
    "@type": "Article",
    "@id": `${canonicalUrl}#article`,
    mainEntityOfPage: { "@type": "WebPage", "@id": canonicalUrl },
    url: canonicalUrl,
    headline: truncate(interview.title, 110),
    description: truncate(interview.excerpt, DESCRIPTION_LIMIT),
    image: [absoluteUrl(interview.coverImage)],
    datePublished: isoDate(interview.datePublished),
    dateModified: isoDate(interview.updatedAt ?? interview.datePublished),
    author: [authorNode(interview.interviewerName)],
    publisher: publisherRef,
    about: compact({
      "@type": "Person",
      name: interview.intervieweeName,
      jobTitle: interview.intervieweeRole || undefined,
      worksFor: interview.intervieweeCompany ? { "@type": "Organization", name: interview.intervieweeCompany } : undefined,
    }),
    articleSection: interview.category?.name,
    inLanguage: "pt-AO",
    isPartOf: { "@id": WEBSITE_ID },
  });
}

const EVENT_STATUS: Partial<Record<EndiamaEvent["status"], string>> = {
  CANCELLED: "https://schema.org/EventCancelled",
};

/** Combines the event's calendar date with its "HH:MM" start/end time, in Luanda time (UTC+1, no DST). */
function eventDateTime(date?: string, time?: string): string | undefined {
  if (!date) return undefined;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return undefined;
  // Calendar day as shown on the page (Africa/Luanda), not the UTC day.
  const day = new Date(parsed.getTime() + 60 * 60 * 1000).toISOString().slice(0, 10);
  if (time && /^\d{2}:\d{2}$/.test(time)) return `${day}T${time}:00+01:00`;
  return day;
}

export function eventJsonLd(event: EndiamaEvent, canonicalUrl: string): JsonLdNode {
  return compact({
    "@type": "Event",
    "@id": `${canonicalUrl}#event`,
    url: canonicalUrl,
    name: event.title,
    description: truncate(event.description, DESCRIPTION_LIMIT) || undefined,
    image: event.imageUrl ? [absoluteUrl(event.imageUrl)] : undefined,
    startDate: eventDateTime(event.startsAt, event.startTime),
    endDate: eventDateTime(event.endsAt ?? (event.endTime ? event.startsAt : undefined), event.endTime),
    eventStatus: EVENT_STATUS[event.status] ?? "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: compact({
      "@type": "Place",
      name: event.location,
      address: event.address ?? event.location,
    }),
    // Only an organiser recorded in the CMS — never assumed.
    organizer: event.organizer ? { "@type": "Organization", name: event.organizer } : undefined,
  });
}

/** Resolves a CMS video reference into the URLs search engines understand. */
export function videoSourceUrls(videoType: Video["videoType"] | NewsBlock["videoType"], videoUrl?: string): { embedUrl?: string; contentUrl?: string } {
  if (!videoUrl) return {};
  if (videoType === "YOUTUBE") return { embedUrl: `https://www.youtube.com/embed/${encodeURIComponent(videoUrl)}` };
  if (videoType === "VIMEO") return { embedUrl: `https://player.vimeo.com/video/${encodeURIComponent(videoUrl)}` };
  return { contentUrl: absoluteUrl(resolveMediaUrl(videoUrl)) };
}

/**
 * VideoObject requires name, thumbnailUrl and uploadDate — a video without a
 * real publication date is skipped instead of being given an invented one.
 */
export function videoObjectJsonLd(video: Video): JsonLdNode | null {
  if (!video.datePublished || !video.thumbnailUrl) return null;
  return compact({
    "@type": "VideoObject",
    name: video.title,
    description: truncate(video.description || video.title, DESCRIPTION_LIMIT),
    thumbnailUrl: [absoluteUrl(video.thumbnailUrl)],
    uploadDate: isoDate(video.datePublished),
    duration: isoDuration(video.durationSeconds),
    ...videoSourceUrls(video.videoType, video.videoUrl),
    publisher: publisherRef,
  });
}

/** Video blocks embedded in an article body, dated with the article itself. */
export function articleVideoJsonLd(blocks: NewsBlock[], article: { title: string; excerpt: string; coverImage: string; publishedAt?: string }): JsonLdNode[] {
  if (!article.publishedAt) return [];
  return blocks
    .filter((block) => block.type === "video" && block.videoUrl)
    .map((block) =>
      compact({
        "@type": "VideoObject",
        name: plainText(block.title) || article.title,
        description: truncate(plainText(block.caption) || article.excerpt || article.title, DESCRIPTION_LIMIT),
        thumbnailUrl: [absoluteUrl(block.thumbnailUrl ? resolveMediaUrl(block.thumbnailUrl) : article.coverImage)],
        uploadDate: isoDate(article.publishedAt),
        ...videoSourceUrls(block.videoType, block.videoUrl),
        publisher: publisherRef,
      })
    );
}

export function audioJsonLd(audio: EndiamaAudio, canonicalUrl: string): JsonLdNode {
  return compact({
    "@type": "AudioObject",
    "@id": `${canonicalUrl}#audio`,
    url: canonicalUrl,
    name: audio.title,
    description: truncate(audio.description || audio.title, DESCRIPTION_LIMIT),
    contentUrl: audio.audioUrl ? absoluteUrl(resolveMediaUrl(audio.audioUrl)) : undefined,
    thumbnailUrl: audio.coverImage ? absoluteUrl(audio.coverImage) : undefined,
    uploadDate: isoDate(audio.datePublished),
    duration: isoDuration(audio.durationSeconds),
    publisher: publisherRef,
    inLanguage: "pt-AO",
  });
}

const GALLERY_IMAGE_LIMIT = 60;

export function galleryJsonLd(album: GalleryAlbum, canonicalUrl: string): JsonLdNode {
  return compact({
    "@type": "ImageGallery",
    "@id": `${canonicalUrl}#gallery`,
    url: canonicalUrl,
    name: album.title,
    description: album.description ? truncate(album.description, DESCRIPTION_LIMIT) : undefined,
    dateCreated: isoDate(album.eventDate),
    dateModified: isoDate(album.updatedAt),
    publisher: publisherRef,
    image: album.photos.slice(0, GALLERY_IMAGE_LIMIT).map((photo) =>
      compact({
        "@type": "ImageObject",
        contentUrl: absoluteUrl(photo.imageUrl),
        thumbnailUrl: photo.thumbnailUrl ? absoluteUrl(photo.thumbnailUrl) : undefined,
        caption: plainText(photo.caption) || plainText(photo.altText) || undefined,
      })
    ),
  });
}

/** Wraps nodes into a single @graph document. */
export function jsonLdGraph(nodes: Array<JsonLdNode | null | undefined>): JsonLdNode {
  return { "@context": "https://schema.org", "@graph": nodes.filter((node): node is JsonLdNode => Boolean(node)) };
}
