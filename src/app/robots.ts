import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { SITEMAP_PATHS } from "@/lib/seo/sitemap-paths";

/**
 * Public content and rendering resources (/_next/, /images/) stay crawlable.
 * Only the administrative area and the internal Next.js API routes are
 * excluded — the admin pages additionally send `noindex` (metadata +
 * X-Robots-Tag) because a robots.txt Disallow alone does not stop a URL
 * that is linked elsewhere from being indexed.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/"],
      },
    ],
    sitemap: SITEMAP_PATHS.map((path) => `${SITE_URL}${path}`),
  };
}
