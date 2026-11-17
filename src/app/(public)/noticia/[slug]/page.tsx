import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { articleVideoJsonLd, breadcrumbJsonLd, jsonLdGraph, newsArticleJsonLd } from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { absoluteUrl } from "@/lib/site";
import { getCommentsByNewsId } from "@/application/use-cases/comment-use-cases";
import { getLatestDocuments } from "@/application/use-cases/document-use-cases";
import { getAdjacentNews, getLatestNews, getNewsBySlug, getRelatedNews } from "@/application/use-cases/news-use-cases";
import { getAllVideos } from "@/application/use-cases/video-use-cases";
import { ArticleBody } from "@/presentation/components/article/article-body";
import { ArticleGallery } from "@/presentation/components/article/article-gallery";
import { ArticleHero } from "@/presentation/components/article/article-hero";
import { ArticlePrevNext } from "@/presentation/components/article/article-prev-next";
import { CommentsSection } from "@/presentation/components/article/comments-section";
import { LikeButton } from "@/presentation/components/article/like-button";
import { ReadingProgressBar } from "@/presentation/components/article/reading-progress-bar";
import { RelatedNews } from "@/presentation/components/article/related-news";
import { JsonLd } from "@/presentation/components/seo/json-ld";
import { TagsList } from "@/presentation/components/article/tags-list";
import { BookmarkButton } from "@/presentation/components/ui/bookmark-button";
import { Container } from "@/presentation/components/ui/container";
import { DocumentCard } from "@/presentation/components/ui/document-card";
import { Reveal } from "@/presentation/components/ui/reveal";
import { ShareButton } from "@/presentation/components/ui/share-button";
import { VideoCard } from "@/presentation/components/video/video-card";

interface NewsArticlePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const newsList = await getLatestNews(500);
  return newsList.map((news) => ({ slug: news.slug }));
}

export async function generateMetadata({ params }: NewsArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const news = await getNewsBySlug(slug, locale);
  if (!news) return {};

  // Editorial SEO overrides are written in Portuguese; the cookie-based EN view
  // keeps the (translated) article title/excerpt instead.
  const seo = locale === "pt" ? news.seo : undefined;

  return buildPageMetadata({
    title: seo?.title || news.title,
    description: seo?.description || news.excerpt,
    path: `/noticia/${news.slug}`,
    canonical: seo?.canonicalUrl,
    image: { url: seo?.ogImage || news.coverImage, alt: news.coverImageAlt },
    ogTitle: seo?.ogTitle,
    ogDescription: seo?.ogDescription,
    type: "article",
    publishedTime: news.publishedAt,
    modifiedTime: news.updatedAt,
    authors: news.author?.name ? [news.author.name] : undefined,
    section: news.category.name,
    tags: news.tags.map((tag) => tag.name),
    index: news.seo?.index,
    follow: news.seo?.follow,
  });
}

export default async function NewsArticlePage({ params }: NewsArticlePageProps) {
  const { slug } = await params;
  const locale = await getLocale();
  const t = await getTranslations();
  const news = await getNewsBySlug(slug, locale);
  if (!news) notFound();

  const [related, adjacent, comments, allVideos, documents] = await Promise.all([
    getRelatedNews(news.id, 4, locale),
    getAdjacentNews(news.id, locale),
    getCommentsByNewsId(news.id),
    getAllVideos(),
    getLatestDocuments(2),
  ]);

  const relatedVideos = allVideos.filter((video) => video.category.slug === news.category.slug).slice(0, 3);

  const canonicalUrl = absoluteUrl(news.seo?.canonicalUrl || `/noticia/${news.slug}`);
  const jsonLd = jsonLdGraph([
    newsArticleJsonLd(news, canonicalUrl),
    breadcrumbJsonLd([
      { name: "Início", path: "/" },
      { name: "Notícias", path: "/noticias" },
      { name: news.category.name, path: `/categoria/${news.category.slug}` },
      { name: news.title },
    ]),
    ...articleVideoJsonLd(news.blocks, news),
  ]);

  return (
    <>
      <JsonLd data={jsonLd} />
      <ReadingProgressBar />
      <ArticleHero news={news} />

      <Container>
        <div className="mx-auto flex max-w-4xl flex-col gap-14 py-14">
          <Reveal className="flex flex-wrap items-center justify-between gap-4">
            <LikeButton initialLikes={news.likes} />
            <div className="flex items-center gap-2">
              <BookmarkButton label={t("common.bookmarkArticle")} />
              <ShareButton title={news.title} variant="full" />
            </div>
          </Reveal>

          <ArticleBody blocks={news.blocks} articleTitle={news.title} />

          <Reveal>
            <TagsList tags={news.tags} />
          </Reveal>

          <ArticleGallery images={news.galleryImages ?? []} title={news.title} />

          {relatedVideos.length > 0 ? (
            <section>
              <h2 className="font-heading text-xl font-medium text-foreground">{t("common.relatedVideos")}</h2>
              <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-3">
                {relatedVideos.map((video) => (
                  <VideoCard key={video.id} video={video} />
                ))}
              </div>
            </section>
          ) : null}

          {documents.length > 0 ? (
            <section>
              <h2 className="font-heading text-xl font-medium text-foreground">{t("common.documents")}</h2>
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {documents.map((document) => (
                  <DocumentCard key={document.id} document={document} animated={false} />
                ))}
              </div>
            </section>
          ) : null}

          <CommentsSection newsId={news.id} initialComments={comments} />
          <RelatedNews news={related} />
          <ArticlePrevNext previous={adjacent.previous} next={adjacent.next} />
        </div>
      </Container>
    </>
  );
}
