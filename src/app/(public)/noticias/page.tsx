import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { getAllCategories } from "@/application/use-cases/category-use-cases";
import { listNews } from "@/application/use-cases/news-use-cases";
import { NewsExplorer } from "@/presentation/components/news/news-explorer";
import { Container } from "@/presentation/components/ui/container";
import { Reveal } from "@/presentation/components/ui/reveal";

export const metadata: Metadata = {
  title: "Notícias",
  description: "Todas as notícias do Portal da Sala de Imprensa da ENDIAMA E.P.",
};

const PAGE_SIZE = 12;
const EMPTY_PAGE = { data: [], pagination: { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false } };

export default async function NoticiasPage() {
  const locale = await getLocale();
  const [listResult, categories] = await Promise.all([
    listNews({ page: 1, limit: PAGE_SIZE, sortBy: "publishedAt", sortOrder: "desc" }, locale).catch(() => EMPTY_PAGE),
    getAllCategories(locale).catch(() => []),
  ]);

  return (
    <div className="pb-24 pt-36 sm:pt-40">
      <Container>
        <Reveal className="max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400">Arquivo</span>
          <h1 className="mt-3 font-heading text-4xl font-medium tracking-tight text-foreground sm:text-5xl">Todas as Notícias</h1>
          <p className="mt-4 text-base text-foreground/60 sm:text-lg">
            Explore o arquivo completo de notícias da ENDIAMA E.P. e do sector diamantífero angolano.
          </p>
        </Reveal>

        <div className="mt-12">
          <NewsExplorer initialData={listResult.data} initialPagination={listResult.pagination} categories={categories} pageSize={PAGE_SIZE} />
        </div>
      </Container>
    </div>
  );
}
