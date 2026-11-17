import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { Suspense } from "react";
import { getHeroData } from "@/application/use-cases/get-homepage-data";
import { getLatestNewsSection } from "@/application/use-cases/latest-news-use-cases";
import { BreakingNewsBar } from "@/presentation/components/home/breaking-news-bar";
import { HeroSlideshow } from "@/presentation/components/home/hero-slideshow";
import { HomepageBody } from "@/presentation/components/home/homepage-body";
import { HomepageBodySkeleton } from "@/presentation/components/home/homepage-body-skeleton";
import { buildPageMetadata } from "@/lib/seo/metadata";

const HOME_TITLE = "ENDIAMA Notícias — Sala de Imprensa da ENDIAMA E.P.";

export const metadata: Metadata = {
  ...buildPageMetadata({
    title: HOME_TITLE,
    description:
      "Portal de notícias oficial da ENDIAMA E.P. — Empresa Nacional de Diamantes de Angola. Cobertura do sector mineiro, mercado diamantífero, sustentabilidade e responsabilidade social.",
    path: "/",
  }),
  // The site name is already in this title — skip the layout's "— ENDIAMA Notícias" suffix.
  title: { absolute: HOME_TITLE },
};

export default async function HomePage() {
  const locale = await getLocale();
  const [hero, latestNews] = await Promise.all([getHeroData(locale), getLatestNewsSection(locale).catch(() => null)]);
  const breakingBarNews = latestNews?.showBreakingBar && latestNews.breaking ? [latestNews.breaking] : [];

  return (
    <>
      <HeroSlideshow slides={hero.heroSlides} />
      <BreakingNewsBar news={breakingBarNews} />
      <Suspense fallback={<HomepageBodySkeleton />}>
        <HomepageBody excludeIds={hero.excludeIds} />
      </Suspense>
    </>
  );
}
