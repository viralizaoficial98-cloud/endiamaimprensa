import type { Metadata } from "next";
import {
  absoluteUrl,
  DEFAULT_OG_IMAGE,
  DESCRIPTION_MAX_LENGTH,
  ORGANIZATION_NAME,
  SITE_LOCALE,
  SITE_NAME,
  TITLE_MAX_LENGTH,
  truncate,
} from "@/lib/site";

/** Must match the root layout's title template ("%s — ENDIAMA Notícias"). */
const TITLE_SUFFIX = ` — ${SITE_NAME}`;

export interface PageImage {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
}

export interface PageMetadataInput {
  /** Page title without the site suffix (the root layout's template appends it). */
  title: string;
  description?: string | null;
  /** Site-relative path of this page, e.g. "/noticias". Becomes the canonical URL. */
  path: string;
  /** Overrides the canonical URL (absolute, or a site-relative path). */
  canonical?: string | null;
  image?: PageImage | null;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
  section?: string;
  tags?: string[];
  /** Set to false to emit `noindex` for this page (e.g. editorially hidden content). */
  index?: boolean;
  follow?: boolean;
  /** Overrides og:title / og:description when the editor set dedicated share texts. */
  ogTitle?: string | null;
  ogDescription?: string | null;
}

/**
 * One helper for every public page so canonical, Open Graph and Twitter Card
 * tags are always complete and consistent. Next.js merges metadata shallowly —
 * a page that sets `openGraph` replaces the layout's whole `openGraph` object —
 * so every field (site name, locale, image fallback) is filled in here.
 */
export function buildPageMetadata(input: PageMetadataInput): Metadata {
  const description = truncate(input.description, DESCRIPTION_MAX_LENGTH) || undefined;
  const canonical = input.canonical ? absoluteUrl(input.canonical) : absoluteUrl(input.path);
  const ownImage = input.image?.url ? { ...input.image, url: absoluteUrl(input.image.url) } : null;
  const image = ownImage ?? { ...DEFAULT_OG_IMAGE, url: absoluteUrl(DEFAULT_OG_IMAGE.url), alt: ORGANIZATION_NAME };
  const ogTitle = input.ogTitle?.trim() || input.title;
  const ogDescription = truncate(input.ogDescription, DESCRIPTION_MAX_LENGTH) || description;
  const index = input.index ?? true;
  const follow = input.follow ?? true;

  const images = [{ url: image.url, alt: image.alt ?? input.title, ...(image.width ? { width: image.width } : {}), ...(image.height ? { height: image.height } : {}) }];

  // Long headlines would lose their end in search results once the brand
  // suffix is appended — use them on their own instead (title stays unique).
  const title = input.title.length + TITLE_SUFFIX.length > TITLE_MAX_LENGTH ? { absolute: input.title } : input.title;

  return {
    title,
    description,
    alternates: { canonical },
    robots: index && follow ? undefined : { index, follow, googleBot: { index, follow } },
    openGraph:
      input.type === "article"
        ? {
            type: "article",
            siteName: SITE_NAME,
            locale: SITE_LOCALE,
            url: canonical,
            title: ogTitle,
            description: ogDescription,
            images,
            publishedTime: input.publishedTime,
            modifiedTime: input.modifiedTime,
            authors: input.authors?.length ? input.authors : undefined,
            section: input.section,
            tags: input.tags?.length ? input.tags : undefined,
          }
        : {
            type: "website",
            siteName: SITE_NAME,
            locale: SITE_LOCALE,
            url: canonical,
            title: ogTitle,
            description: ogDescription,
            images,
          },
    twitter: {
      // A wide editorial photo suits the large card; the logo-only fallback does not.
      card: ownImage ? "summary_large_image" : "summary",
      title: ogTitle,
      description: ogDescription,
      images: [image.url],
    },
  };
}

