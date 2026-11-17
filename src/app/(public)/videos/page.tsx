import type { Metadata } from "next";
import { Suspense } from "react";
import { getAllVideos } from "@/application/use-cases/video-use-cases";
import { jsonLdGraph, videoObjectJsonLd } from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/presentation/components/seo/json-ld";
import { Container } from "@/presentation/components/ui/container";
import { Reveal } from "@/presentation/components/ui/reveal";
import { VideosPageClient } from "@/presentation/components/video/videos-page-client";

export const metadata: Metadata = buildPageMetadata({
  title: "Vídeos",
  description: "Vídeos institucionais, reportagens e documentários da ENDIAMA E.P.",
  path: "/videos",
});

export default async function VideosPage() {
  const videos = await getAllVideos();
  const jsonLd = jsonLdGraph(videos.slice(0, 50).map(videoObjectJsonLd));

  return (
    <div className="pb-24 pt-36 sm:pt-40">
      <JsonLd data={jsonLd} />
      <Container>
        <Reveal className="max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400">
            Multimédia
          </span>
          <h1 className="mt-3 font-heading text-4xl font-medium tracking-tight text-foreground sm:text-5xl">Vídeos</h1>
          <p className="mt-4 text-base text-foreground/60 sm:text-lg">
            Documentários, reportagens e conteúdos institucionais da ENDIAMA E.P.
          </p>
        </Reveal>

        <div className="mt-12">
          <Suspense fallback={<div className="shimmer aspect-video w-full rounded-2xl" />}>
            <VideosPageClient videos={videos} />
          </Suspense>
        </div>
      </Container>
    </div>
  );
}
