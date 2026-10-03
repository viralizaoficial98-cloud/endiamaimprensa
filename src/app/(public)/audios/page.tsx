import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { listAudios } from "@/application/use-cases/audio-use-cases";
import { getAllCategories } from "@/application/use-cases/category-use-cases";
import { AudiosExplorer } from "@/presentation/components/audio/audios-explorer";
import { Container } from "@/presentation/components/ui/container";
import { Reveal } from "@/presentation/components/ui/reveal";

export const metadata: Metadata = {
  title: "Áudios",
  description: "Ouça entrevistas, declarações, reportagens e conteúdos institucionais da ENDIAMA E.P.",
};

export default async function AudiosPage() {
  const locale = await getLocale();
  const [{ data: audios }, categories] = await Promise.all([
    listAudios({ limit: 60 }).catch(() => ({ data: [], pagination: { page: 1, limit: 60, total: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false } })),
    getAllCategories(locale).catch(() => []),
  ]);

  return (
    <div className="pb-24 pt-36 sm:pt-40">
      <Container>
        <Reveal className="max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400">Multimédia</span>
          <h1 className="mt-3 font-heading text-4xl font-medium tracking-tight text-foreground sm:text-5xl">Áudios</h1>
          <p className="mt-4 text-base text-foreground/60 sm:text-lg">
            Ouça entrevistas, declarações, reportagens e conteúdos institucionais da ENDIAMA E.P.
          </p>
        </Reveal>

        <div className="mt-12">
          {audios.length === 0 ? (
            <p className="py-16 text-center text-sm text-foreground/50">Ainda não existem áudios publicados.</p>
          ) : (
            <AudiosExplorer audios={audios} categories={categories} />
          )}
        </div>
      </Container>
    </div>
  );
}
