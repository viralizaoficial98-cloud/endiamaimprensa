"use client";

import { useLocale } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { HiOutlineArrowPath } from "react-icons/hi2";
import type { Category, News } from "@/domain/entities";
import type { NewsSortBy } from "@/domain/repositories";
import type { PaginationMeta } from "@/domain/shared/pagination";
import { listNews } from "@/application/use-cases/news-use-cases";
import { RevealGroup } from "@/presentation/components/ui/reveal";
import { NewsGridCard, pickCardVariant } from "./news-grid-card";
import { GridSkeleton } from "./news-skeletons";

type SortOption = "recent" | "mostRead" | "featured";

const SORT_LABELS: Record<SortOption, string> = {
  recent: "Mais recentes",
  mostRead: "Mais lidas",
  featured: "Em destaque",
};

function sortToParams(sort: SortOption): { sortBy: NewsSortBy; sortOrder: "asc" | "desc"; isFeatured?: boolean } {
  if (sort === "mostRead") return { sortBy: "viewsCount", sortOrder: "desc" };
  if (sort === "featured") return { sortBy: "publishedAt", sortOrder: "desc", isFeatured: true };
  return { sortBy: "publishedAt", sortOrder: "desc" };
}

export function NewsExplorer({
  initialData,
  initialPagination,
  categories,
  pageSize = 9,
}: {
  initialData: News[];
  initialPagination: PaginationMeta;
  categories: Category[];
  pageSize?: number;
}) {
  const locale = useLocale();
  const [items, setItems] = useState(initialData);
  const [pagination, setPagination] = useState(initialPagination);
  const [category, setCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<SortOption>("recent");
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const isFirstRender = useRef(true);

  async function fetchPage(page: number, append: boolean) {
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError(false);
    try {
      const result = await listNews({ page, limit: pageSize, category: category ?? undefined, ...sortToParams(sort) }, locale);
      setItems((prev) => (append ? [...prev, ...result.data] : result.data));
      setPagination(result.pagination);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    fetchPage(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, sort]);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="scrollbar-hide -mx-1 flex min-w-0 flex-1 gap-2 overflow-x-auto px-1 pb-1">
          <FilterChip active={category === null} onClick={() => setCategory(null)}>
            Todas
          </FilterChip>
          {categories.map((c) => (
            <FilterChip key={c.id} active={category === c.slug} onClick={() => setCategory(c.slug)}>
              {c.name}
            </FilterChip>
          ))}
        </div>

        <label className="flex shrink-0 items-center gap-2 text-sm text-foreground/60">
          Ordenar por
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="rounded-full border border-border-subtle bg-surface px-3.5 py-1.5 text-sm text-foreground outline-none transition-colors focus:border-brand-500"
          >
            {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
              <option key={key} value={key}>
                {SORT_LABELS[key]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-8">
        {loading ? (
          <GridSkeleton count={pageSize} />
        ) : error ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-border-subtle py-16 text-center">
            <p className="text-sm text-foreground/60">Não foi possível carregar as notícias neste momento.</p>
            <button
              type="button"
              onClick={() => fetchPage(1, false)}
              className="inline-flex items-center gap-2 rounded-full border border-border-subtle px-5 py-2 text-sm font-semibold text-foreground/70 transition-colors hover:border-brand-500 hover:text-brand-600"
            >
              <HiOutlineArrowPath className="size-4" />
              Tentar novamente
            </button>
          </div>
        ) : items.length === 0 ? (
          <p className="py-16 text-center text-sm text-foreground/50">Ainda não existem notícias publicadas nesta categoria.</p>
        ) : (
          <RevealGroup className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" stagger={0.08}>
            {items.map((item, i) => (
              <NewsGridCard key={item.id} news={item} variant={pickCardVariant(i)} priority={i < 3} />
            ))}
          </RevealGroup>
        )}
      </div>

      {!loading && !error && pagination.hasNextPage ? (
        <div className="mt-10 flex justify-center">
          <button
            type="button"
            disabled={loadingMore}
            onClick={() => fetchPage(pagination.page + 1, true)}
            className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
          >
            {loadingMore ? (
              <>
                <HiOutlineArrowPath className="size-4 animate-spin" />
                A carregar...
              </>
            ) : (
              "Carregar mais notícias"
            )}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium transition-colors duration-300 ${
        active
          ? "border-brand-600 bg-brand-600 text-white"
          : "border-border-subtle text-foreground/60 hover:border-brand-500 hover:text-brand-600"
      }`}
    >
      {children}
    </button>
  );
}
