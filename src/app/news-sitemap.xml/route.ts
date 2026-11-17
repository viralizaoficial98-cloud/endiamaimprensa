import { getRecentPublishedNews, googleNewsEntries, renderGoogleNewsUrlset, xmlResponse } from "@/lib/seo/sitemap";

/**
 * Google News sitemap: only articles published in the last 48 hours (max
 * 1 000), as required by Google News. An empty <urlset> is valid and normal
 * when nothing was published in that window.
 */
export async function GET() {
  try {
    return xmlResponse(renderGoogleNewsUrlset(googleNewsEntries(await getRecentPublishedNews())));
  } catch {
    return new Response("Sitemap temporariamente indisponível.", { status: 503, headers: { "Retry-After": "300" } });
  }
}
