import type { MetadataRoute } from "next";

const SITE_URL = "https://imprensa.endiama.co.ao";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
