import dynamic from "next/dynamic";
import { getLocale } from "next-intl/server";
import { Suspense } from "react";
import {
  getAudioHighlightsSectionData,
  getDocumentsSectionData,
  getEventsSectionData,
  getInfographicsSectionData,
  getInternationalSectionData,
  getMostReadSectionData,
  getPartnersSectionData,
  getReportsSectionData,
  getVideosSectionData,
} from "@/application/use-cases/get-homepage-data";
import { AngolaMapSection } from "@/presentation/components/home/angola-map-section";
import { AudioHighlightsSection } from "@/presentation/components/home/audio-highlights-section";
import { DocumentsSection } from "@/presentation/components/home/documents-section";
import { EventsSection } from "@/presentation/components/home/events-section";
import { GalleryPreviewSection } from "@/presentation/components/home/gallery-preview-section";
import {
  BandSectionSkeleton,
  GridSectionSkeleton,
  StripSectionSkeleton,
} from "@/presentation/components/home/homepage-body-skeleton";
import { InterviewsSection } from "@/presentation/components/home/interviews-section";
import { LatestNewsSection } from "@/presentation/components/home/latest-news-section";
import { MostReadSection } from "@/presentation/components/home/most-read-section";
import { NewsletterSection } from "@/presentation/components/home/newsletter-section";
import { NewsStripSection } from "@/presentation/components/home/news-strip-section";
import { PartnersSection } from "@/presentation/components/home/partners-section";

const VideosSection = dynamic(() => import("@/presentation/components/home/videos-section").then((m) => m.VideosSection));

async function MostReadData({ excludeIds }: { excludeIds: string[] }) {
  const locale = await getLocale();
  return <MostReadSection news={await getMostReadSectionData(excludeIds, locale)} />;
}
async function VideosData() {
  return <VideosSection videos={await getVideosSectionData()} />;
}
async function AudioHighlightsData() {
  return <AudioHighlightsSection audios={await getAudioHighlightsSectionData()} />;
}
async function DocumentsData() {
  return <DocumentsSection documents={await getDocumentsSectionData()} />;
}
async function EventsData() {
  return <EventsSection events={await getEventsSectionData()} viewAllHref="/eventos" />;
}
async function PartnersData() {
  return <PartnersSection partners={await getPartnersSectionData()} />;
}
async function InfographicsData({ excludeIds }: { excludeIds: string[] }) {
  const locale = await getLocale();
  return <NewsStripSection eyebrow="Dados" title="Infográficos" news={await getInfographicsSectionData(excludeIds, locale)} muted />;
}
async function ReportsData({ excludeIds }: { excludeIds: string[] }) {
  const locale = await getLocale();
  return <NewsStripSection eyebrow="Aprofundar" title="Reportagens" news={await getReportsSectionData(excludeIds, locale)} />;
}
async function InternationalData({ excludeIds }: { excludeIds: string[] }) {
  const locale = await getLocale();
  return <NewsStripSection eyebrow="Mundo" title="Notícias Internacionais" news={await getInternationalSectionData(excludeIds, locale)} muted />;
}

/** Everything below the Hero + breaking-news ticker. Each section below fetches
 * its own data and owns its own Suspense boundary, so a slow query (e.g.
 * Gallery's 24 images, or Events/Partners) never holds back a faster one —
 * every boundary streams to the browser independently, in priority order:
 * Latest/MostRead first, then Videos/Gallery/Interviews/Documents/Events,
 * then the lighter strips and Partners. `excludeIds` (the Hero's story IDs)
 * is threaded through so nothing below the fold repeats a story already
 * shown at the top of the page. */
export function HomepageBody({ excludeIds }: { excludeIds: string[] }) {
  return (
    <>
      <Suspense fallback={<GridSectionSkeleton tiles={3} />}>
        <LatestNewsSection excludeIds={excludeIds} />
      </Suspense>
      <Suspense fallback={<StripSectionSkeleton />}>
        <MostReadData excludeIds={excludeIds} />
      </Suspense>

      <Suspense fallback={<GridSectionSkeleton tiles={4} />}>
        <VideosData />
      </Suspense>
      <Suspense fallback={<GridSectionSkeleton tiles={4} />}>
        <AudioHighlightsData />
      </Suspense>
      <Suspense fallback={<GridSectionSkeleton tiles={6} />}>
        <GalleryPreviewSection />
      </Suspense>
      <Suspense fallback={<GridSectionSkeleton tiles={4} />}>
        <InterviewsSection />
      </Suspense>
      <Suspense fallback={<GridSectionSkeleton tiles={5} />}>
        <DocumentsData />
      </Suspense>
      <Suspense fallback={<GridSectionSkeleton tiles={4} />}>
        <EventsData />
      </Suspense>

      <Suspense fallback={<StripSectionSkeleton />}>
        <InfographicsData excludeIds={excludeIds} />
      </Suspense>
      <Suspense fallback={<StripSectionSkeleton />}>
        <ReportsData excludeIds={excludeIds} />
      </Suspense>
      <Suspense fallback={<StripSectionSkeleton />}>
        <InternationalData excludeIds={excludeIds} />
      </Suspense>

      <Suspense fallback={<BandSectionSkeleton />}>
        <PartnersData />
      </Suspense>
      <NewsletterSection />
      <AngolaMapSection />
    </>
  );
}
