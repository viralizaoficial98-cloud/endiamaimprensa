import {
  audioEntries,
  eventEntries,
  galleryEntries,
  getAllPublishedNews,
  interviewEntries,
  newsEntries,
  pageEntries,
  renderUrlset,
  type SitemapEntry,
  xmlResponse,
} from "@/lib/seo/sitemap";
import { TYPED_SITEMAPS, type TypedSitemap } from "@/lib/seo/sitemap-paths";

const BUILDERS: Record<TypedSitemap, () => Promise<SitemapEntry[]>> = {
  paginas: pageEntries,
  noticias: async () => newsEntries(await getAllPublishedNews()),
  entrevistas: interviewEntries,
  eventos: eventEntries,
  galerias: galleryEntries,
  audios: audioEntries,
};

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const name = file.replace(/\.xml$/, "") as TypedSitemap;
  if (!file.endsWith(".xml") || !TYPED_SITEMAPS.includes(name)) {
    return new Response("Not found", { status: 404 });
  }

  try {
    return xmlResponse(renderUrlset(await BUILDERS[name]()));
  } catch {
    // Never serve an empty-but-valid sitemap when the API is down: a 503 tells
    // crawlers to retry later instead of dropping every URL it listed.
    return new Response("Sitemap temporariamente indisponível.", { status: 503, headers: { "Retry-After": "300" } });
  }
}
