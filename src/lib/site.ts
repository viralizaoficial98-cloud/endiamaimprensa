/**
 * Single source of truth for the portal's public identity (canonical domain,
 * name, logo) — used by metadata, robots.txt, sitemaps and JSON-LD so they can
 * never drift apart again (previously each file hard-coded its own, different
 * domain).
 *
 * NEXT_PUBLIC_SITE_URL lets a deploy change the canonical domain without a
 * code change. NEXT_PUBLIC_* values are inlined at build time, so a change
 * requires `npm run build` + restart.
 */
const DEFAULT_SITE_URL = "https://www.novo.endiamaimprensa.com";

function normaliseSiteUrl(raw: string | undefined): string {
  const value = (raw ?? "").trim();
  if (!value) return DEFAULT_SITE_URL;
  try {
    const url = new URL(value);
    return `${url.protocol}//${url.host}`;
  } catch {
    return DEFAULT_SITE_URL;
  }
}

export const SITE_URL = normaliseSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);

/** Brand name already used by the portal (title template, og:site_name). */
export const SITE_NAME = "ENDIAMA Notícias";
/** Official short name of the organisation, as already used across the portal. */
export const ORGANIZATION_NAME = "ENDIAMA E.P.";
export const ORGANIZATION_LEGAL_NAME = "Empresa Nacional de Diamantes de Angola, E.P.";
export const SITE_LOGO_PATH = "/images/logotipo_endiama.png";
/** Institutional share image for pages that have no image of their own (real size: 1043×239). */
export const DEFAULT_OG_IMAGE = { url: "/images/logotipo_endiama.png", width: 1043, height: 239 } as const;
export const SITE_LOCALE = "pt_AO";
export const SITE_LANGUAGE = "pt";

/** Recommended display limits for search results on mobile. */
export const TITLE_MAX_LENGTH = 60;
export const DESCRIPTION_MAX_LENGTH = 155;

/** Turns a site-relative path (or an already-absolute URL) into an absolute URL on the canonical domain. */
export function absoluteUrl(pathOrUrl: string = "/"): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return path === "/" ? SITE_URL : `${SITE_URL}${path}`;
}

/** Collapses whitespace and strips any HTML tags — metadata must be plain text. */
export function plainText(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Truncates on a word boundary and appends an ellipsis, never cutting a word in half. */
export function truncate(value: string | null | undefined, max: number): string {
  const text = plainText(value);
  if (text.length <= max) return text;
  const slice = text.slice(0, max - 1);
  const lastSpace = slice.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? slice.slice(0, lastSpace) : slice).replace(/[\s,.;:–—-]+$/, "")}…`;
}

/** True when a URL points to this portal's canonical host. */
export function isOwnUrl(url: string): boolean {
  try {
    return new URL(url, SITE_URL).host === new URL(SITE_URL).host;
  } catch {
    return false;
  }
}
