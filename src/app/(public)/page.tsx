import { getLocale } from "next-intl/server";
import { Suspense } from "react";
import { getHeroData } from "@/application/use-cases/get-homepage-data";
import { getLatestNewsSection } from "@/application/use-cases/latest-news-use-cases";
import { BreakingNewsBar } from "@/presentation/components/home/breaking-news-bar";
import { HeroSlideshow } from "@/presentation/components/home/hero-slideshow";
import { HomepageBody } from "@/presentation/components/home/homepage-body";
import { HomepageBodySkeleton } from "@/presentation/components/home/homepage-body-skeleton";

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
