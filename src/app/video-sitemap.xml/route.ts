import { renderUrlset, videoEntries, xmlResponse } from "@/lib/seo/sitemap";

/** Video sitemap: each video declared on the public page that plays it (/videos or the news article embedding it). */
export async function GET() {
  try {
    return xmlResponse(renderUrlset(await videoEntries()));
  } catch {
    return new Response("Sitemap temporariamente indisponível.", { status: 503, headers: { "Retry-After": "300" } });
  }
}
