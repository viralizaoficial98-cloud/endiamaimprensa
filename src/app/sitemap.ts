import type { MetadataRoute } from "next";
import { getAllCategories } from "@/application/use-cases/category-use-cases";
import { getLatestNews } from "@/application/use-cases/news-use-cases";

const SITE_URL = "https://imprensa.endiama.co.ao";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, newsList] = await Promise.all([getAllCategories(), getLatestNews(500)]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "hourly", priority: 1 },
    { url: `${SITE_URL}/galeria`, changeFrequency: "daily", priority: 0.7 },
    { url: `${SITE_URL}/videos`, changeFrequency: "daily", priority: 0.7 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${SITE_URL}/categoria/${category.slug}`,
    changeFrequency: "daily",
    priority: 0.6,
  }));

  const newsRoutes: MetadataRoute.Sitemap = newsList.map((news) => ({
    url: `${SITE_URL}/noticia/${news.slug}`,
    lastModified: news.updatedAt ?? news.publishedAt,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  return [...staticRoutes, ...categoryRoutes, ...newsRoutes];
}
