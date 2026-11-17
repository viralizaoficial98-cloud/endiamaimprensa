/** Every sitemap the portal publishes. `/sitemap.xml` is the index of the per-type sitemaps; all three are listed in robots.txt. */
export const SITEMAP_INDEX_PATH = "/sitemap.xml";
export const NEWS_SITEMAP_PATH = "/news-sitemap.xml";
export const VIDEO_SITEMAP_PATH = "/video-sitemap.xml";

export const SITEMAP_PATHS = [SITEMAP_INDEX_PATH, NEWS_SITEMAP_PATH, VIDEO_SITEMAP_PATH] as const;

/** Per-type sitemaps listed inside the index, served at /sitemaps/<name>.xml. */
export const TYPED_SITEMAPS = ["paginas", "noticias", "entrevistas", "eventos", "galerias", "audios"] as const;
export type TypedSitemap = (typeof TYPED_SITEMAPS)[number];

export function typedSitemapPath(name: TypedSitemap): string {
  return `/sitemaps/${name}.xml`;
}
