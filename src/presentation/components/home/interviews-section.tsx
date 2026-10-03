import { getLocale } from "next-intl/server";
import { getAllCategories } from "@/application/use-cases/category-use-cases";
import { getLatestInterviews } from "@/application/use-cases/interview-use-cases";
import { Container } from "@/presentation/components/ui/container";
import { SectionHeader } from "@/presentation/components/ui/section-header";
import { RetryPanel } from "@/presentation/components/ui/retry-panel";
import { InterviewsExplorer } from "@/presentation/components/interviews/interviews-explorer";

export async function InterviewsSection() {
  let interviews, categories;
  try {
    const locale = await getLocale();
    [interviews, categories] = await Promise.all([getLatestInterviews(20), getAllCategories(locale)]);
  } catch {
    return (
      <section id="entrevistas" className="py-20 sm:py-28">
        <Container>
          <SectionHeader eyebrow="Vozes" title="Entrevistas" />
          <RetryPanel message="Não foi possível carregar as entrevistas neste momento." />
        </Container>
      </section>
    );
  }

  return (
    <section id="entrevistas" className="py-20 sm:py-28">
      <Container>
        <SectionHeader eyebrow="Vozes" title="Entrevistas" description="Conversas com quem lidera e constrói o sector diamantífero angolano." />
        {interviews.length === 0 ? (
          <p className="py-16 text-center text-sm text-foreground/50">Ainda não existem entrevistas publicadas.</p>
        ) : (
          <InterviewsExplorer interviews={interviews} categories={categories} />
        )}
      </Container>
    </section>
  );
}
