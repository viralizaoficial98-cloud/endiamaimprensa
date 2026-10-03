import { getLocale } from "next-intl/server";
import { getAllCategories } from "@/application/use-cases/category-use-cases";
import { getLatestNewsSection } from "@/application/use-cases/latest-news-use-cases";
import { listNews } from "@/application/use-cases/news-use-cases";
import { BreakingStrip } from "@/presentation/components/news/breaking-strip";
import { FeaturedBlock } from "@/presentation/components/news/featured-block";
import { NewsExplorer } from "@/presentation/components/news/news-explorer";
import { Container } from "@/presentation/components/ui/container";
import { SectionHeader } from "@/presentation/components/ui/section-header";

const PAGE_SIZE = 9;

const EMPTY_PAGE = { data: [], pagination: { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false } };

/** Everything in the "principal + 2 secundárias + Última Hora" area is curated
 * from the admin panel (Gestão das Últimas Notícias) via getLatestNewsSection()
 * — it is never chosen automatically by recency. The paginated grid below it
 * is the only part that still lists plain recent articles. */
export async function LatestNewsSection({ excludeIds = [] }: { excludeIds?: string[] }) {
  const locale = await getLocale();
  const [section, categories] = await Promise.all([
    getLatestNewsSection(locale).catch(() => null),
    getAllCategories(locale).catch(() => []),
  ]);

  if (!section || !section.showSection) return null;

  const highlightIds = [section.main?.id, ...section.secondary.map((n) => n.id), section.breaking?.id].filter(
    (id): id is string => Boolean(id)
  );
  const gridExcludeIds = [...excludeIds, ...highlightIds];
  const listResult = await listNews({ page: 1, limit: PAGE_SIZE, sortBy: "publishedAt", sortOrder: "desc", excludeIds: gridExcludeIds }, locale).catch(
    () => EMPTY_PAGE
  );

  return (
    <section id="ultimas-noticias" className="bg-surface-muted py-20 sm:py-28">
      <Container>
        <SectionHeader
          eyebrow="Actualidade"
          title={section.title}
          description={section.subtitle}
          href={section.showViewAll ? "/noticias" : undefined}
          hrefLabel={section.viewAllLabel}
        />

        {section.showBreakingBar ? <BreakingStrip news={section.breaking ? [section.breaking] : []} /> : null}

        {section.main ? (
          <div className="mb-14">
            <FeaturedBlock main={section.main} secondary={section.secondary} />
          </div>
        ) : null}

        <NewsExplorer initialData={listResult.data} initialPagination={listResult.pagination} categories={categories} pageSize={PAGE_SIZE} />
      </Container>
    </section>
  );
}
