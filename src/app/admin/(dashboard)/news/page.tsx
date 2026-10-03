"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { adminDelete, adminGetPaginated, adminPost, type PaginationMeta } from "@/infrastructure/api/admin-http-client";
import { revalidateContentCache } from "@/infrastructure/api/revalidate-client";
import { describeError } from "@/presentation/admin/news-form";
import { TranslationBadges } from "@/presentation/admin/translation-badges";
import { useAdminAuth } from "@/presentation/admin/auth-context";
import { formatDateTime } from "@/lib/format";

interface AdminNewsRow {
  id: string;
  title: string;
  slug: string;
  status: string;
  isFeatured: boolean;
  isBreaking: boolean;
  viewsCount: number;
  publishedAt: string | null;
  createdAt: string;
  category: { name: string };
  author: { name: string };
  _translations?: { pt: boolean; en: boolean };
}

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Rascunho",
  UNDER_REVIEW: "Em Revisão",
  APPROVED: "Aprovada",
  SCHEDULED: "Agendada",
  PUBLISHED: "Publicada",
  REJECTED: "Rejeitada",
  ARCHIVED: "Arquivada",
  UNPUBLISHED: "Despublicada",
};

const STATUS_OPTIONS = ["", ...Object.keys(STATUS_LABEL)];

export default function AdminNewsListPage() {
  const { hasPermission } = useAdminAuth();
  const [rows, setRows] = useState<AdminNewsRow[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [flash, setFlashMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("admin_flash");
      if (stored) {
        setFlashMessage(stored);
        sessionStorage.removeItem("admin_flash");
      }
    } catch {
      // sessionStorage indisponível — sem mensagem, sem quebrar a página.
    }
  }, []);

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "15", sortBy: "publishedAt", sortOrder });
      if (search) params.set("search", search);
      if (status) params.set("status", status);
      if (dateFrom) params.set("dateFrom", new Date(dateFrom).toISOString());
      if (dateTo) params.set("dateTo", new Date(`${dateTo}T23:59:59`).toISOString());
      const result = await adminGetPaginated<AdminNewsRow>(`/admin/news?${params.toString()}`);
      setRows(result.data);
      setPagination(result.pagination);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status, sortOrder, dateFrom, dateTo]);

  async function runAction(id: string, action: string, body?: unknown) {
    setActionError(null);
    try {
      await adminPost(`/admin/news/${id}/${action}`, body);
      await revalidateContentCache(["news"]);
      load();
    } catch (err) {
      setActionError(describeError(err, "Falha ao executar a acção."));
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!window.confirm(`Tem certeza de que pretende eliminar a notícia "${title}"?`)) return;
    setActionError(null);
    try {
      await adminDelete(`/admin/news/${id}`);
      await revalidateContentCache(["news"]);
      load();
    } catch (err) {
      setActionError(describeError(err, "Falha ao eliminar a notícia."));
    }
  }

  const canApprove = hasPermission("news.approve");
  const canPublish = hasPermission("news.publish");
  const canDelete = hasPermission("news.delete");

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-medium text-foreground">Notícias</h1>
          <p className="mt-1 text-sm text-foreground/50">Gestão do fluxo editorial completo.</p>
        </div>
        {hasPermission("news.create") ? (
          <Link href="/admin/news/new" className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
            Nova Notícia
          </Link>
        ) : null}
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
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s ? STATUS_LABEL[s] : "Todos os estados"}
            </option>
          ))}
        </select>
        <select
          value={sortOrder}
          onChange={(e) => {
            setSortOrder(e.target.value as "desc" | "asc");
            setPage(1);
          }}
          className="rounded-lg border border-border-subtle bg-surface px-3.5 py-2 text-sm outline-none focus:border-brand-500"
        >
          <option value="desc">Data de publicação — mais recentes</option>
          <option value="asc">Data de publicação — mais antigas</option>
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
          {dateFrom || dateTo ? (
            <button
              type="button"
              onClick={() => {
                setDateFrom("");
                setDateTo("");
                setPage(1);
              }}
              className="text-brand-600 hover:underline"
            >
              Limpar
            </button>
          ) : null}
        </div>
      </div>

      {flash ? (
        <p className="mt-4 flex items-center justify-between rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800 dark:border-brand-800/50 dark:bg-brand-950/30 dark:text-brand-300">
          {flash}
          <button type="button" onClick={() => setFlashMessage(null)} className="text-xs font-medium underline">
            Fechar
          </button>
        </p>
      ) : null}
      {actionError ? <p className="mt-4 text-sm text-red-500">{actionError}</p> : null}

      <div className="mt-6 overflow-x-auto rounded-xl border border-border-subtle bg-surface">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-surface-muted text-left text-xs uppercase tracking-wide text-foreground/50">
            <tr>
              <th className="px-4 py-3">Título</th>
              <th className="px-4 py-3">Idiomas</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Autor</th>
              <th className="px-4 py-3">Data Publicação</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Vistas</th>
              <th className="px-4 py-3">Acções</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-foreground/40">
                  A carregar...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-foreground/40">
                  Nenhuma notícia encontrada.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-t border-border-subtle align-top">
                  <td className="px-4 py-3">
                    <Link href={`/admin/news/${row.id}`} className="font-medium text-foreground hover:text-brand-600">
                      {row.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <TranslationBadges translations={row._translations} />
                  </td>
                  <td className="px-4 py-3 text-foreground/70">{row.category.name}</td>
                  <td className="px-4 py-3 text-foreground/70">{row.author.name}</td>
                  <td className="px-4 py-3 text-foreground/70">{row.publishedAt ? formatDateTime(row.publishedAt) : "—"}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-brand-600/10 px-2.5 py-1 text-xs font-medium text-brand-700">
                      {STATUS_LABEL[row.status] ?? row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-foreground/70">{row.viewsCount.toLocaleString("pt-AO")}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {row.status === "DRAFT" ? (
                        <ActionButton onClick={() => runAction(row.id, "submit-review")}>Enviar p/ revisão</ActionButton>
                      ) : null}
                      {row.status === "DRAFT" && canPublish ? <ActionButton onClick={() => runAction(row.id, "publish")}>Publicar</ActionButton> : null}
                      {row.status === "UNDER_REVIEW" && canApprove ? (
                        <>
                          <ActionButton onClick={() => runAction(row.id, "approve")}>Aprovar</ActionButton>
                          <ActionButton
                            onClick={() => {
                              const reason = window.prompt("Motivo da rejeição:");
                              if (reason) runAction(row.id, "reject", { reason });
                            }}
                          >
                            Rejeitar
                          </ActionButton>
                        </>
                      ) : null}
                      {row.status === "APPROVED" && canPublish ? <ActionButton onClick={() => runAction(row.id, "publish")}>Publicar</ActionButton> : null}
                      {row.status === "PUBLISHED" && canPublish ? (
                        <>
                          <ActionButton onClick={() => runAction(row.id, "unpublish")}>Despublicar</ActionButton>
                          <ActionButton onClick={() => runAction(row.id, "archive")}>Arquivar</ActionButton>
                        </>
                      ) : null}
                      {canDelete ? (
                        <button
                          type="button"
                          onClick={() => handleDelete(row.id, row.title)}
                          className="rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-500 transition-colors hover:border-red-400 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-950/30"
                        >
                          Eliminar
                        </button>
                      ) : null}
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
            Página {pagination.page} de {pagination.totalPages} — {pagination.total} notícias
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

function ActionButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md border border-border-subtle px-2 py-1 text-xs font-medium text-foreground/70 transition-colors hover:border-brand-500 hover:text-brand-600"
    >
      {children}
    </button>
  );
}
