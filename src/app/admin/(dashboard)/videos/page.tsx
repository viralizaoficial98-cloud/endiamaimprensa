"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { adminDelete, adminGetPaginated, adminPatch, type PaginationMeta } from "@/infrastructure/api/admin-http-client";
import { revalidateContentCache } from "@/infrastructure/api/revalidate-client";
import { describeError } from "@/presentation/admin/news-form";
import { formatDateTime, formatDuration } from "@/lib/format";

interface AdminVideoRow {
  id: string;
  title: string;
  slug: string;
  thumbnail: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  duration: number;
  viewsCount: number;
  publishedAt: string | null;
  videoType: string;
  category: { id: string; name: string } | null;
}

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Rascunho",
  PUBLISHED: "Publicado",
  ARCHIVED: "Arquivado",
};

const SOURCE_LABEL: Record<string, string> = {
  UPLOAD: "Upload",
  YOUTUBE: "YouTube",
  VIMEO: "Vimeo",
  EXTERNAL: "URL externa",
};

export default function AdminVideosPage() {
  const [rows, setRows] = useState<AdminVideoRow[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [sortBy, setSortBy] = useState("publishedAt");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    adminGetPaginated<CategoryOption>("/admin/categories?limit=50").then((res) => setCategories(res.data));
    try {
      const stored = sessionStorage.getItem("admin_flash");
      if (stored) {
        setFlash(stored);
        sessionStorage.removeItem("admin_flash");
      }
    } catch {
      // sessionStorage indisponível.
    }
  }, []);

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "15", sortBy, sortOrder });
      if (search) params.set("search", search);
      if (status) params.set("status", status);
      if (category) params.set("category", category);
      if (dateFrom) params.set("dateFrom", new Date(dateFrom).toISOString());
      if (dateTo) params.set("dateTo", new Date(`${dateTo}T23:59:59`).toISOString());
      const result = await adminGetPaginated<AdminVideoRow>(`/admin/videos?${params.toString()}`);
      setRows(result.data);
      setPagination(result.pagination);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status, category, sortBy, sortOrder, dateFrom, dateTo]);

  async function handleStatusChange(id: string, newStatus: string) {
    setActionError(null);
    try {
      await adminPatch(`/admin/videos/${id}`, { status: newStatus });
      await revalidateContentCache(["videos"]);
      load();
    } catch (err) {
      setActionError(describeError(err, "Falha ao actualizar estado."));
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!window.confirm(`Tem certeza que deseja eliminar o vídeo "${title}"? Esta acção não poderá ser desfeita.`)) return;
    setActionError(null);
    try {
      await adminDelete(`/admin/videos/${id}`);
      await revalidateContentCache(["videos"]);
      load();
    } catch (err) {
      setActionError(describeError(err, "Falha ao eliminar o vídeo."));
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-medium text-foreground">Vídeos</h1>
          <p className="mt-1 text-sm text-foreground/50">Gestão dos conteúdos audiovisuais publicados no Portal Sala de Imprensa.</p>
        </div>
        <Link href="/admin/videos/new" className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
          + Novo Vídeo
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setPage(1);
              load();
            }
          }}
          placeholder="Pesquisar por título..."
          className="w-64 rounded-lg border border-border-subtle bg-surface px-3.5 py-2 text-sm outline-none focus:border-brand-500"
        />
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-border-subtle bg-surface px-3.5 py-2 text-sm outline-none focus:border-brand-500"
        >
          <option value="">Todos os estados</option>
          <option value="PUBLISHED">Publicado</option>
          <option value="DRAFT">Rascunho</option>
          <option value="ARCHIVED">Arquivado</option>
        </select>
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-border-subtle bg-surface px-3.5 py-2 text-sm outline-none focus:border-brand-500"
        >
          <option value="">Todas as categorias</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={`${sortBy}:${sortOrder}`}
          onChange={(e) => {
            const [by, order] = e.target.value.split(":");
            setSortBy(by);
            setSortOrder(order as "desc" | "asc");
            setPage(1);
          }}
          className="rounded-lg border border-border-subtle bg-surface px-3.5 py-2 text-sm outline-none focus:border-brand-500"
        >
          <option value="publishedAt:desc">Mais recentes</option>
          <option value="publishedAt:asc">Mais antigos</option>
          <option value="viewsCount:desc">Mais visualizados</option>
          <option value="title:asc">Título A-Z</option>
        </select>
        <div className="flex items-center gap-2 text-xs text-foreground/60">
          <span>De</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-border-subtle bg-surface px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
          <span>Até</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-border-subtle bg-surface px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
        </div>
      </div>

      {flash ? (
        <p className="mt-4 flex items-center justify-between rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800 dark:border-brand-800/50 dark:bg-brand-950/30 dark:text-brand-300">
          {flash}
          <button type="button" onClick={() => setFlash(null)} className="text-xs font-medium underline">
            Fechar
          </button>
        </p>
      ) : null}
      {actionError ? <p className="mt-4 text-sm text-red-500">{actionError}</p> : null}

      <div className="mt-6 overflow-x-auto rounded-xl border border-border-subtle bg-surface">
        <table className="w-full min-w-[1000px] text-sm">
          <thead className="bg-surface-muted text-left text-xs uppercase tracking-wide text-foreground/50">
            <tr>
              <th className="px-4 py-3">Thumbnail</th>
              <th className="px-4 py-3">Título</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Data Publicação</th>
              <th className="px-4 py-3">Duração</th>
              <th className="px-4 py-3">Visualizações</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Acções</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-foreground/40">
                  A carregar...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-foreground/40">
                  Nenhum vídeo encontrado.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-t border-border-subtle align-middle">
                  <td className="px-4 py-3">
                    <div className="relative h-12 w-20 overflow-hidden rounded-lg bg-surface-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={row.thumbnail} alt="" className="h-full w-full object-cover" />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/videos/${row.id}`} className="font-medium text-foreground hover:text-brand-600">
                      {row.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-foreground/70">{row.category?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-foreground/70">{SOURCE_LABEL[row.videoType] ?? row.videoType}</td>
                  <td className="px-4 py-3 text-foreground/70">{row.publishedAt ? formatDateTime(row.publishedAt) : "—"}</td>
                  <td className="px-4 py-3 text-foreground/70">{formatDuration(row.duration)}</td>
                  <td className="px-4 py-3 text-foreground/70">{row.viewsCount.toLocaleString("pt-AO")}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-brand-600/10 px-2.5 py-1 text-xs font-medium text-brand-700">
                      {STATUS_LABEL[row.status] ?? row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      <Link href={`/admin/videos/${row.id}`} className="rounded-md border border-border-subtle px-2 py-1 text-xs font-medium text-foreground/70 hover:border-brand-500 hover:text-brand-600">
                        Editar
                      </Link>
                      {row.status !== "PUBLISHED" ? (
                        <button type="button" onClick={() => handleStatusChange(row.id, "PUBLISHED")} className="rounded-md border border-border-subtle px-2 py-1 text-xs font-medium text-foreground/70 hover:border-brand-500 hover:text-brand-600">
                          Publicar
                        </button>
                      ) : null}
                      {row.status === "PUBLISHED" ? (
                        <button type="button" onClick={() => handleStatusChange(row.id, "DRAFT")} className="rounded-md border border-border-subtle px-2 py-1 text-xs font-medium text-foreground/70 hover:border-brand-500 hover:text-brand-600">
                          Despublicar
                        </button>
                      ) : null}
                      {row.status !== "ARCHIVED" ? (
                        <button type="button" onClick={() => handleStatusChange(row.id, "ARCHIVED")} className="rounded-md border border-border-subtle px-2 py-1 text-xs font-medium text-foreground/70 hover:border-brand-500 hover:text-brand-600">
                          Arquivar
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => handleDelete(row.id, row.title)}
                        className="rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-500 transition-colors hover:border-red-400 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-950/30"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 ? (
        <div className="mt-4 flex items-center justify-between text-sm text-foreground/60">
          <span>
            Página {pagination.page} de {pagination.totalPages} — {pagination.total} vídeos
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={!pagination.hasPreviousPage}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-border-subtle px-3 py-1.5 disabled:opacity-40"
            >
              Anterior
            </button>
            <button
              type="button"
              disabled={!pagination.hasNextPage}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-border-subtle px-3 py-1.5 disabled:opacity-40"
            >
              Seguinte
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
