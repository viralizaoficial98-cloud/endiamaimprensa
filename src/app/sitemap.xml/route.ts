import { NEWS_SITEMAP_PATH, TYPED_SITEMAPS, typedSitemapPath, VIDEO_SITEMAP_PATH } from "@/lib/seo/sitemap-paths";
import { renderSitemapIndex, xmlResponse } from "@/lib/seo/sitemap";
import { absoluteUrl } from "@/lib/site";

/**
 * Sitemap index — the single URL to submit in Google Search Console and Bing
 * Webmaster Tools. Kept at /sitemap.xml so any previously submitted URL keeps
 * working. Each child sitemap is generated live on request.
 */
export async function GET() {
  return xmlResponse(
    renderSitemapIndex([
      ...TYPED_SITEMAPS.map((name) => ({ loc: absoluteUrl(typedSitemapPath(name)) })),
      { loc: absoluteUrl(NEWS_SITEMAP_PATH) },
      { loc: absoluteUrl(VIDEO_SITEMAP_PATH) },
    ])
  );
}
