"use client";

import { useEffect, useRef, useState } from "react";
import { HiOutlineArrowPath, HiOutlineMagnifyingGlass } from "react-icons/hi2";
import type { HistoricalNews } from "@/domain/entities";
import type { PaginationMeta } from "@/domain/shared/pagination";
import { listHistoricalNews } from "@/application/use-cases/historical-news-use-cases";
import { GridSkeleton } from "@/presentation/components/news/news-skeletons";
import { RevealGroup } from "@/presentation/components/ui/reveal";
import { HistoricalNewsCard } from "./historical-news-card";

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 16 }, (_, i) => CURRENT_YEAR - i);

export function HistoricalArchiveExplorer({
  initialData,
  initialPagination,
  pageSize = 12,
}: {
  initialData: HistoricalNews[];
  initialPagination: PaginationMeta;
  pageSize?: number;
}) {
  const [search, setSearch] = useState("");
  const [year, setYear] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [items, setItems] = useState(initialData);
  const [pagination, setPagination] = useState(initialPagination);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const isFirstRender = useRef(true);

  async function fetchPage(page: number, append: boolean) {
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError(false);
    try {
      const result = await listHistoricalNews({
        page,
        limit: pageSize,
        search: search.trim() || undefined,
        year: year ? Number(year) : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
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
    const timeout = setTimeout(() => fetchPage(1, false), 350);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, year, dateFrom, dateTo]);

  function clearFilters() {
    setSearch("");
    setYear("");
    setDateFrom("");
    setDateTo("");
  }

  const hasActiveFilters = Boolean(search || year || dateFrom || dateTo);

  return (
    <div>
      <div className="flex flex-col gap-3 rounded-2xl border border-border-subtle bg-surface p-4 sm:flex-row sm:flex-wrap sm:items-end">
        <label className="flex min-w-0 flex-1 flex-col gap-1.5 sm:min-w-[220px]">
          <span className="text-xs font-medium text-foreground/60">Pesquisar</span>
          <span className="flex items-center gap-2 rounded-lg border border-border-subtle bg-background px-3 py-2">
            <HiOutlineMagnifyingGlass className="size-4 shrink-0 text-foreground/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Título ou conteúdo..."
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-foreground/40"
            />
          </span>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-foreground/60">Ano</span>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-brand-500"
          >
            <option value="">Todos</option>
            {YEAR_OPTIONS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-foreground/60">De</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-brand-500"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-foreground/60">Até</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-brand-500"
          />
        </label>

        {hasActiveFilters ? (
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-lg border border-border-subtle px-3 py-2 text-xs font-medium text-foreground/60 transition-colors hover:border-brand-500 hover:text-brand-600"
          >
            Limpar filtros
          </button>
        ) : null}
      </div>

      <p className="mt-4 text-xs text-foreground/45">
        {loading ? "A pesquisar..." : `${pagination.total} notícia${pagination.total === 1 ? "" : "s"} encontrada${pagination.total === 1 ? "" : "s"}`}
      </p>

      <div className="mt-4">
        {loading ? (
          <GridSkeleton count={pageSize} />
        ) : error ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-border-subtle py-16 text-center">
            <p className="text-sm text-foreground/60">Não foi possível carregar o arquivo histórico neste momento.</p>
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
          <p className="py-16 text-center text-sm text-foreground/50">Nenhuma notícia histórica encontrada para esta pesquisa.</p>
        ) : (
          <RevealGroup className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" stagger={0.06}>
            {items.map((item, i) => (
              <HistoricalNewsCard key={item.id} news={item} priority={i < 3} />
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
