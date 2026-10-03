import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { getAllCategories } from "@/application/use-cases/category-use-cases";
import { getLatestInterviews } from "@/application/use-cases/interview-use-cases";
import { InterviewsExplorer } from "@/presentation/components/interviews/interviews-explorer";
import { Container } from "@/presentation/components/ui/container";
import { Reveal } from "@/presentation/components/ui/reveal";

export const metadata: Metadata = {
  title: "Entrevistas",
  description: "Conversas com quem lidera e constrói o sector diamantífero angolano.",
};

export default async function EntrevistasPage() {
  const locale = await getLocale();
  const [interviews, categories] = await Promise.all([
    getLatestInterviews(60).catch(() => []),
    getAllCategories(locale).catch(() => []),
  ]);

  return (
    <div className="pb-24 pt-36 sm:pt-40">
      <Container>
        <Reveal className="max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400">Vozes</span>
          <h1 className="mt-3 font-heading text-4xl font-medium tracking-tight text-foreground sm:text-5xl">Entrevistas</h1>
          <p className="mt-4 text-base text-foreground/60 sm:text-lg">
            Conversas com quem lidera e constrói o sector diamantífero angolano.
          </p>
        </Reveal>

        <div className="mt-12">
          {interviews.length === 0 ? (
            <p className="py-16 text-center text-sm text-foreground/50">Ainda não existem entrevistas publicadas.</p>
          ) : (
            <InterviewsExplorer interviews={interviews} categories={categories} priority />
          )}
        </div>
      </Container>
    </div>
  );
}
