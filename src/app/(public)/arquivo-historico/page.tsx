import type { Metadata } from "next";
import { listHistoricalNews } from "@/application/use-cases/historical-news-use-cases";
import { HistoricalArchiveExplorer } from "@/presentation/components/historical-archive/historical-archive-explorer";
import { Container } from "@/presentation/components/ui/container";
import { Reveal } from "@/presentation/components/ui/reveal";

export const metadata: Metadata = {
  title: "Arquivo Histórico de Notícias",
  description: "Consulte o arquivo histórico de notícias da ENDIAMA E.P., preservado a partir do antigo portal de imprensa.",
};

const PAGE_SIZE = 12;
const EMPTY_PAGE = { data: [], pagination: { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false } };

export default async function ArquivoHistoricoPage() {
  const initial = await listHistoricalNews({ page: 1, limit: PAGE_SIZE }).catch(() => EMPTY_PAGE);

  return (
    <div className="pb-24 pt-36 sm:pt-40">
      <Container>
        <Reveal className="max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400">Arquivo</span>
          <h1 className="mt-3 font-heading text-4xl font-medium tracking-tight text-foreground sm:text-5xl">Arquivo Histórico de Notícias</h1>
          <p className="mt-4 text-base text-foreground/60 sm:text-lg">
            Pesquise notícias publicadas no antigo portal de imprensa da ENDIAMA E.P. As notícias originais abrem no site onde foram
            publicadas.
          </p>
        </Reveal>

        <div className="mt-12">
          <HistoricalArchiveExplorer initialData={initial.data} initialPagination={initial.pagination} pageSize={PAGE_SIZE} />
        </div>
      </Container>
    </div>
  );
}
