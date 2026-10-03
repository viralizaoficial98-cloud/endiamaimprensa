"use client";

import { useEffect, useState } from "react";
import { HiOutlineMagnifyingGlass, HiOutlineXMark } from "react-icons/hi2";
import { adminGetPaginated, type PaginationMeta } from "@/infrastructure/api/admin-http-client";

export interface SelectableNews {
  id: string;
  title: string;
  slug: string;
  coverImage: string;
  publishedAt: string | null;
  category: { id: string; name: string; slug: string };
}

interface CategoryOption {
  id: string;
  slug: string;
  name: string;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** "Seleccionar Notícia" — used by every slot (Principal, Secundária 01/02, Última
 * Hora). Only ever lists PUBLISHED news (server-enforced via status=PUBLISHED),
 * matching the requirement that draft/archived/deleted articles can't be chosen. */
export function LatestNewsSelectModal({
  open,
  onClose,
  onSelect,
  excludeIds = [],
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (news: SelectableNews) => void;
  excludeIds?: string[];
}) {
  const [rows, setRows] = useState<SelectableNews[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    adminGetPaginated<CategoryOption>("/admin/categories?limit=50").then((res) => setCategories(res.data)).catch(() => {});
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: "10",
      status: "PUBLISHED",
      sortBy: "publishedAt",
      sortOrder,
    });
    if (search.trim()) params.set("search", search.trim());
    if (category) params.set("category", category);
    adminGetPaginated<SelectableNews>(`/admin/news?${params.toString()}`)
      .then((res) => {
        setRows(res.data);
        setPagination(res.pagination);
      })
      .finally(() => setLoading(false));
  }, [open, page, search, category, sortOrder]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl bg-surface shadow-xl">
        <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
          <h2 className="font-heading text-lg font-medium text-foreground">Seleccionar Notícia</h2>
          <button type="button" onClick={onClose} aria-label="Fechar" className="rounded-full p-1.5 text-foreground/50 hover:bg-surface-muted hover:text-foreground">
            <HiOutlineXMark className="size-5" />
          </button>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-border-subtle px-5 py-3">
          <div className="relative flex-1 min-w-[160px]">
            <HiOutlineMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground/40" />
            <input
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              placeholder="Pesquisar notícia..."
              className="w-full rounded-lg border border-border-subtle bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-500"
            />
          </div>
          <select
            value={category}
            onChange={(e) => {
              setPage(1);
              setCategory(e.target.value);
            }}
            className="rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm outline-none focus:border-brand-500"
          >
            <option value="">Todas as categorias</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={sortOrder}
            onChange={(e) => {
              setPage(1);
              setSortOrder(e.target.value as "desc" | "asc");
            }}
            className="rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm outline-none focus:border-brand-500"
          >
            <option value="desc">Mais recentes</option>
            <option value="asc">Mais antigas</option>
          </select>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {loading ? (
            <p className="py-10 text-center text-sm text-foreground/40">A carregar...</p>
          ) : rows.length === 0 ? (
            <p className="py-10 text-center text-sm text-foreground/40">Nenhuma notícia publicada encontrada.</p>
          ) : (
            <div className="space-y-1.5">
              {rows.map((news) => {
                const disabled = excludeIds.includes(news.id);
                return (
                  <div
                    key={news.id}
                    className={`flex items-center gap-3 rounded-xl border p-2.5 ${disabled ? "border-border-subtle/50 opacity-50" : "border-border-subtle"}`}
                  >
                    <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-lg bg-surface-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={news.coverImage} alt="" className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{news.title}</p>
                      <p className="truncate text-xs text-foreground/50">
                        {news.category?.name ?? "Sem categoria"} · {formatDate(news.publishedAt)} · Publicada
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => onSelect(news)}
                      className="shrink-0 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {disabled ? "Já em destaque" : "Seleccionar"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {pagination && pagination.totalPages > 1 ? (
          <div className="flex items-center justify-between border-t border-border-subtle px-5 py-3 text-xs text-foreground/50">
            <span>
              Página {pagination.page} de {pagination.totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={!pagination.hasPreviousPage}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-md border border-border-subtle px-2.5 py-1 disabled:opacity-40"
              >
                Anterior
              </button>
              <button
                type="button"
                disabled={!pagination.hasNextPage}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-md border border-border-subtle px-2.5 py-1 disabled:opacity-40"
              >
                Seguinte
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
