"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { HiBolt, HiOutlineBars3, HiOutlineEye, HiOutlinePlus, HiOutlineStar, HiOutlineTrash, HiOutlineXMark } from "react-icons/hi2";
import { adminDelete, adminGet, adminGetPaginated, adminPatch, adminPost, adminPut, type PaginationMeta } from "@/infrastructure/api/admin-http-client";
import { revalidateContentCache } from "@/infrastructure/api/revalidate-client";
import type { NewsDto } from "@/infrastructure/api/dto";
import { mapNews } from "@/infrastructure/api/mappers";
import { describeError } from "@/presentation/admin/news-form";
import { LatestNewsSelectModal, type SelectableNews } from "@/presentation/admin/latest-news-select-modal";
import { BreakingStrip } from "@/presentation/components/news/breaking-strip";
import { FeaturedBlock } from "@/presentation/components/news/featured-block";

interface AdminItem {
  id: string;
  newsId: string;
  position: "MAIN" | "SECONDARY";
  sortOrder: number;
  active: boolean;
  news: NewsDto | null;
}

interface AdminConfig {
  id: string;
  title: string;
  subtitle: string;
  showSection: boolean;
  showBreakingBar: boolean;
  showViewAll: boolean;
  viewAllLabel: string;
  breakingNewsId: string | null;
  breakingTitle: string | null;
  breakingActive: boolean;
  breakingStartsAt: string | null;
  breakingEndsAt: string | null;
  publishedAt: string | null;
}

interface AdminConfigResponse {
  config: AdminConfig;
  main: AdminItem | null;
  secondary: AdminItem[];
  breakingNews: NewsDto | null;
  hasUnpublishedChanges: boolean;
}

interface HistoryRow {
  id: string;
  action: string;
  createdAt: string;
  user: { id: string; name: string; email: string } | null;
}

const ACTION_LABEL: Record<string, string> = {
  UPDATE_SETTINGS: "Actualizou as configurações da secção",
  UPDATE_ITEMS: "Alterou a selecção de notícias",
  UPDATE_ITEM: "Actualizou um item",
  REMOVE_ITEM: "Removeu um item",
  REORDER_ITEMS: "Reordenou as notícias secundárias",
  PUBLISH: "Publicou nova configuração",
};

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

type SlotTarget = "MAIN" | "SECONDARY_NEW" | "SECONDARY_0" | "SECONDARY_1" | "BREAKING";

export default function AdminLatestNewsPage() {
  const [data, setData] = useState<AdminConfigResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [modalTarget, setModalTarget] = useState<SlotTarget | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirmPublishOpen, setConfirmPublishOpen] = useState(false);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [historyPagination, setHistoryPagination] = useState<PaginationMeta | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Local editable copies of section settings (saved via "Guardar Rascunho").
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [showSection, setShowSection] = useState(true);
  const [showBreakingBar, setShowBreakingBar] = useState(true);
  const [showViewAll, setShowViewAll] = useState(true);
  const [viewAllLabel, setViewAllLabel] = useState("");
  const [breakingTitle, setBreakingTitle] = useState("");
  const [breakingStartsAt, setBreakingStartsAt] = useState("");
  const [breakingEndsAt, setBreakingEndsAt] = useState("");

  const dragIndex = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  async function loadConfig() {
    setLoading(true);
    try {
      const res = await adminGet<AdminConfigResponse>("/admin/latest-news");
      setData(res);
      setTitle(res.config.title);
      setSubtitle(res.config.subtitle);
      setShowSection(res.config.showSection);
      setShowBreakingBar(res.config.showBreakingBar);
      setShowViewAll(res.config.showViewAll);
      setViewAllLabel(res.config.viewAllLabel);
      setBreakingTitle(res.config.breakingTitle ?? "");
      setBreakingStartsAt(toDatetimeLocal(res.config.breakingStartsAt));
      setBreakingEndsAt(toDatetimeLocal(res.config.breakingEndsAt));
    } catch (err) {
      setError(describeError(err, "Não foi possível carregar a configuração."));
    } finally {
      setLoading(false);
    }
  }

  async function loadHistory() {
    try {
      const res = await adminGetPaginated<HistoryRow>("/admin/audit?module=latest-news&limit=10");
      setHistory(res.data);
      setHistoryPagination(res.pagination);
    } catch {
      // audit.view pode não estar atribuído a este utilizador — secção fica simplesmente vazia.
    }
  }

  useEffect(() => {
    loadConfig();
    loadHistory();
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

  const excludeIds = data
    ? [data.main?.newsId, ...data.secondary.map((s) => s.newsId)].filter((id): id is string => Boolean(id))
    : [];

  async function handleSelect(news: SelectableNews) {
    if (!data || !modalTarget) return;
    setError(null);
    try {
      if (modalTarget === "BREAKING") {
        await adminPatch("/admin/latest-news", { breakingNewsId: news.id, breakingTitle: news.title });
        setBreakingTitle(news.title);
      } else {
        const items: { newsId: string; position: "MAIN" | "SECONDARY"; sortOrder?: number }[] = [];
        if (data.main) items.push({ newsId: data.main.newsId, position: "MAIN" });
        data.secondary.forEach((s) => items.push({ newsId: s.newsId, position: "SECONDARY", sortOrder: s.sortOrder }));

        if (modalTarget === "MAIN") {
          const idx = items.findIndex((i) => i.position === "MAIN");
          if (idx >= 0) items[idx] = { newsId: news.id, position: "MAIN" };
          else items.push({ newsId: news.id, position: "MAIN" });
        } else if (modalTarget === "SECONDARY_0" || modalTarget === "SECONDARY_1") {
          const slotIndex = modalTarget === "SECONDARY_0" ? 0 : 1;
          const secondaryOnly = items.filter((i) => i.position === "SECONDARY");
          if (secondaryOnly[slotIndex]) {
            const globalIdx = items.indexOf(secondaryOnly[slotIndex]);
            items[globalIdx] = { newsId: news.id, position: "SECONDARY", sortOrder: slotIndex };
          } else {
            items.push({ newsId: news.id, position: "SECONDARY", sortOrder: slotIndex });
          }
        } else if (modalTarget === "SECONDARY_NEW") {
          const secondaryCount = items.filter((i) => i.position === "SECONDARY").length;
          items.push({ newsId: news.id, position: "SECONDARY", sortOrder: secondaryCount });
        }

        await adminPut("/admin/latest-news/items", { items });
      }
      setModalTarget(null);
      await loadConfig();
    } catch (err) {
      setError(describeError(err, "Não foi possível seleccionar esta notícia."));
    }
  }

  async function handleRemoveSecondary(itemId: string) {
    setError(null);
    try {
      await adminDelete(`/admin/latest-news/items/${itemId}`);
      await loadConfig();
    } catch (err) {
      setError(describeError(err, "Não foi possível remover este item."));
    }
  }

  async function handleToggleItemActive(item: AdminItem) {
    setError(null);
    try {
      await adminPatch(`/admin/latest-news/items/${item.id}`, { active: !item.active });
      await loadConfig();
    } catch (err) {
      setError(describeError(err, "Não foi possível actualizar o estado deste item."));
    }
  }

  async function handleToggleBreakingActive() {
    if (!data) return;
    setError(null);
    try {
      await adminPatch("/admin/latest-news", { breakingActive: !data.config.breakingActive });
      await loadConfig();
    } catch (err) {
      setError(describeError(err, "Não foi possível actualizar a Última Hora."));
    }
  }

  function handleDragStart(index: number) {
    dragIndex.current = index;
  }
  function handleDragOver(index: number, e: React.DragEvent) {
    e.preventDefault();
    setDragOverIndex(index);
  }
  async function handleDrop(index: number) {
    const from = dragIndex.current;
    dragIndex.current = null;
    setDragOverIndex(null);
    if (from === null || from === index || !data) return;

    const reordered = [...data.secondary];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(index, 0, moved);

    setError(null);
    try {
      await adminPost("/admin/latest-news/items/reorder", {
        order: reordered.map((item, i) => ({ id: item.id, sortOrder: i })),
      });
      await loadConfig();
    } catch (err) {
      setError(describeError(err, "Não foi possível reordenar as notícias secundárias."));
    }
  }

  async function moveSecondary(index: number, direction: -1 | 1) {
    if (!data) return;
    const target = index + direction;
    if (target < 0 || target >= data.secondary.length) return;
    const reordered = [...data.secondary];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setError(null);
    try {
      await adminPost("/admin/latest-news/items/reorder", {
        order: reordered.map((item, i) => ({ id: item.id, sortOrder: i })),
      });
      await loadConfig();
    } catch (err) {
      setError(describeError(err, "Não foi possível reordenar as notícias secundárias."));
    }
  }

  async function handleSaveDraft() {
    setSaving(true);
    setError(null);
    try {
      await adminPatch("/admin/latest-news", {
        title,
        subtitle,
        showSection,
        showBreakingBar,
        showViewAll,
        viewAllLabel,
        breakingTitle: breakingTitle || null,
        breakingStartsAt: breakingStartsAt ? new Date(breakingStartsAt).toISOString() : null,
        breakingEndsAt: breakingEndsAt ? new Date(breakingEndsAt).toISOString() : null,
      });
      setFlash("Configuração guardada com sucesso.");
      await loadConfig();
    } catch (err) {
      setError(describeError(err, "Erro ao guardar configuração."));
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    setPublishing(true);
    setError(null);
    try {
      await adminPost("/admin/latest-news/publish");
      await revalidateContentCache(["latest-news", "news"]);
      setFlash("Últimas Notícias publicadas com sucesso.");
      setConfirmPublishOpen(false);
      await loadConfig();
      await loadHistory();
    } catch (err) {
      setError(describeError(err, "Erro ao guardar configuração."));
    } finally {
      setPublishing(false);
    }
  }

  if (loading || !data) {
    return <p className="text-sm text-foreground/40">A carregar...</p>;
  }

  const mainNews = data.main?.news ? mapNews(data.main.news) : null;
  const secondaryNews = data.secondary.filter((s) => s.news).map((s) => mapNews(s.news as NewsDto));
  const breakingPreviewNews = data.breakingNews ? mapNews(data.breakingNews) : null;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-medium text-foreground">Gestão das Últimas Notícias</h1>
          <p className="mt-1 text-sm text-foreground/50">Configure os conteúdos em destaque apresentados na secção Últimas Notícias da homepage.</p>
        </div>
        <div className="flex items-center gap-2">
          {data.hasUnpublishedChanges ? (
            <span className="rounded-full bg-gold-500/15 px-3 py-1.5 text-xs font-medium text-gold-700">Alterações não publicadas</span>
          ) : (
            <span className="rounded-full bg-brand-600/10 px-3 py-1.5 text-xs font-medium text-brand-700">Publicado e actualizado</span>
          )}
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
      {error ? <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p> : null}

      {/* A. ÚLTIMA HORA */}
      <section className="mt-6 rounded-2xl border border-border-subtle bg-surface p-5">
        <div className="flex items-center gap-2">
          <HiBolt className="size-4.5 text-brand-600" />
          <h2 className="font-heading text-base font-medium text-foreground">Última Hora</h2>
        </div>
        {data.breakingNews ? (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-border-subtle p-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{breakingTitle || data.breakingNews.title}</p>
              <p className="mt-0.5 text-xs text-foreground/50">
                {data.config.breakingActive ? "Activo" : "Inactivo"}
                {data.config.breakingStartsAt || data.config.breakingEndsAt ? " · com período de exibição definido" : ""}
              </p>
            </div>
            <Link href={`/noticia/${data.breakingNews.slug}`} target="_blank" className="inline-flex size-8 items-center justify-center rounded-md border border-border-subtle text-foreground/60 hover:border-brand-500 hover:text-brand-600">
              <HiOutlineEye className="size-4" />
            </Link>
            <button type="button" onClick={() => setModalTarget("BREAKING")} className="rounded-lg border border-border-subtle px-3 py-1.5 text-xs font-medium hover:border-brand-500 hover:text-brand-600">
              Trocar
            </button>
            <button type="button" onClick={handleToggleBreakingActive} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${data.config.breakingActive ? "bg-foreground/10 text-foreground/60" : "bg-brand-600/10 text-brand-700"}`}>
              {data.config.breakingActive ? "Desactivar" : "Activar"}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setModalTarget("BREAKING")}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border-subtle py-6 text-sm text-foreground/50 hover:border-brand-500 hover:text-brand-600"
          >
            <HiOutlinePlus className="size-4" /> Seleccionar Notícia para Última Hora
          </button>
        )}
        {data.breakingNews ? (
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground/70">Título apresentado</label>
              <input
                value={breakingTitle}
                onChange={(e) => setBreakingTitle(e.target.value)}
                placeholder={data.breakingNews.title}
                className="w-full rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground/70">Início da exibição (opcional)</label>
              <input type="datetime-local" value={breakingStartsAt} onChange={(e) => setBreakingStartsAt(e.target.value)} className="w-full rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm outline-none focus:border-brand-500" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground/70">Fim da exibição (opcional)</label>
              <input type="datetime-local" value={breakingEndsAt} onChange={(e) => setBreakingEndsAt(e.target.value)} className="w-full rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm outline-none focus:border-brand-500" />
            </div>
          </div>
        ) : null}
      </section>

      {/* B. NOTÍCIA PRINCIPAL */}
      <section className="mt-4 rounded-2xl border border-border-subtle bg-surface p-5">
        <div className="flex items-center gap-2">
          <HiOutlineStar className="size-4.5 text-brand-600" />
          <h2 className="font-heading text-base font-medium text-foreground">Notícia Principal</h2>
        </div>
        {data.main?.news ? (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-border-subtle p-3">
            <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-lg bg-surface-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={data.main.news.coverImage} alt="" className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-foreground/50">{data.main.news.category?.name}</p>
              <p className="truncate text-sm font-medium text-foreground">{data.main.news.title}</p>
              <p className="mt-0.5 text-xs text-foreground/50">
                {formatDateTime(data.main.news.publishedAt)} · {data.main.news.readingTime} min de leitura
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggleItemActive(data.main as AdminItem)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium ${data.main.active ? "bg-brand-600/10 text-brand-700" : "bg-foreground/10 text-foreground/60"}`}
            >
              {data.main.active ? "Activo" : "Inactivo"}
            </button>
            <Link href={`/noticia/${data.main.news.slug}`} target="_blank" className="inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-border-subtle text-foreground/60 hover:border-brand-500 hover:text-brand-600">
              <HiOutlineEye className="size-4" />
            </Link>
            <button type="button" onClick={() => setModalTarget("MAIN")} className="shrink-0 rounded-lg border border-border-subtle px-3 py-1.5 text-xs font-medium hover:border-brand-500 hover:text-brand-600">
              Trocar
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setModalTarget("MAIN")}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border-subtle py-8 text-sm text-foreground/50 hover:border-brand-500 hover:text-brand-600"
          >
            <HiOutlinePlus className="size-4" /> Seleccionar Notícia Principal
          </button>
        )}
      </section>

      {/* C. NOTÍCIAS SECUNDÁRIAS */}
      <section className="mt-4 rounded-2xl border border-border-subtle bg-surface p-5">
        <h2 className="font-heading text-base font-medium text-foreground">Notícias Secundárias</h2>
        <div className="mt-4 space-y-2">
          {[0, 1].map((slotIndex) => {
            const item = data.secondary[slotIndex];
            if (!item?.news) {
              return (
                <button
                  key={slotIndex}
                  type="button"
                  onClick={() => setModalTarget(slotIndex === 0 ? "SECONDARY_0" : "SECONDARY_1")}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border-subtle py-5 text-sm text-foreground/50 hover:border-brand-500 hover:text-brand-600"
                >
                  <HiOutlinePlus className="size-4" /> Seleccionar Notícia Secundária {slotIndex + 1}
                </button>
              );
            }
            return (
              <div
                key={item.id}
                draggable
                onDragStart={() => handleDragStart(slotIndex)}
                onDragOver={(e) => handleDragOver(slotIndex, e)}
                onDrop={() => handleDrop(slotIndex)}
                className={`flex items-center gap-3 rounded-xl border p-3 ${dragOverIndex === slotIndex ? "border-brand-500 bg-brand-600/5" : "border-border-subtle"}`}
              >
                <span className="cursor-grab text-foreground/30" title="Arrastar para reordenar">
                  <HiOutlineBars3 className="size-4.5" />
                </span>
                <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-lg bg-surface-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.news.coverImage} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-foreground/50">{item.news.category?.name}</p>
                  <p className="truncate text-sm font-medium text-foreground">{item.news.title}</p>
                  <p className="mt-0.5 text-xs text-foreground/50">
                    {formatDateTime(item.news.publishedAt)} · {item.news.readingTime} min
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button type="button" disabled={slotIndex === 0} onClick={() => moveSecondary(slotIndex, -1)} className="rounded-md border border-border-subtle px-2 py-1 text-xs disabled:opacity-30">
                    ↑
                  </button>
                  <button type="button" disabled={slotIndex === data.secondary.length - 1} onClick={() => moveSecondary(slotIndex, 1)} className="rounded-md border border-border-subtle px-2 py-1 text-xs disabled:opacity-30">
                    ↓
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleItemActive(item)}
                  className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium ${item.active ? "bg-brand-600/10 text-brand-700" : "bg-foreground/10 text-foreground/60"}`}
                >
                  {item.active ? "Activo" : "Inactivo"}
                </button>
                <Link href={`/noticia/${item.news.slug}`} target="_blank" className="inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-border-subtle text-foreground/60 hover:border-brand-500 hover:text-brand-600">
                  <HiOutlineEye className="size-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => setModalTarget(slotIndex === 0 ? "SECONDARY_0" : "SECONDARY_1")}
                  className="shrink-0 rounded-lg border border-border-subtle px-2.5 py-1.5 text-xs font-medium hover:border-brand-500 hover:text-brand-600"
                >
                  Trocar
                </button>
                <button type="button" onClick={() => handleRemoveSecondary(item.id)} className="shrink-0 rounded-lg p-1.5 text-red-500 hover:bg-red-50">
                  <HiOutlineTrash className="size-4" />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* D. CONFIGURAÇÕES DA SECÇÃO */}
      <section className="mt-4 rounded-2xl border border-border-subtle bg-surface p-5">
        <h2 className="font-heading text-base font-medium text-foreground">Configurações da Secção</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/70">Título da secção</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-lg border border-border-subtle bg-background px-3.5 py-2.5 text-sm outline-none focus:border-brand-500" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/70">Texto do botão &quot;Ver todas&quot;</label>
            <input value={viewAllLabel} onChange={(e) => setViewAllLabel(e.target.value)} className="w-full rounded-lg border border-border-subtle bg-background px-3.5 py-2.5 text-sm outline-none focus:border-brand-500" />
          </div>
        </div>
        <div className="mt-4">
          <label className="mb-1.5 block text-xs font-medium text-foreground/70">Subtítulo</label>
          <textarea rows={2} value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className="w-full resize-none rounded-lg border border-border-subtle bg-background px-3.5 py-2.5 text-sm outline-none focus:border-brand-500" />
        </div>
        <div className="mt-4 flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm text-foreground/80">
            <input type="checkbox" checked={showSection} onChange={(e) => setShowSection(e.target.checked)} className="size-4 accent-brand-600" />
            Exibir secção na Homepage
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground/80">
            <input type="checkbox" checked={showBreakingBar} onChange={(e) => setShowBreakingBar(e.target.checked)} className="size-4 accent-brand-600" />
            Exibir Última Hora
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground/80">
            <input type="checkbox" checked={showViewAll} onChange={(e) => setShowViewAll(e.target.checked)} className="size-4 accent-brand-600" />
            Exibir botão &quot;Ver todas as notícias&quot;
          </label>
        </div>
      </section>

      {/* ACTIONS */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button type="button" disabled={saving} onClick={handleSaveDraft} className="rounded-lg border border-border-subtle px-5 py-2.5 text-sm font-semibold text-foreground hover:border-brand-500 hover:text-brand-600 disabled:opacity-50">
          {saving ? "A guardar..." : "Guardar Rascunho"}
        </button>
        <button type="button" onClick={() => setPreviewOpen(true)} className="rounded-lg border border-border-subtle px-5 py-2.5 text-sm font-semibold text-foreground hover:border-brand-500 hover:text-brand-600">
          Pré-visualizar
        </button>
        <button type="button" onClick={() => setConfirmPublishOpen(true)} className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
          Publicar Alterações
        </button>
      </div>

      {/* HISTÓRICO */}
      <section className="mt-8 rounded-2xl border border-border-subtle bg-surface p-5">
        <button type="button" onClick={() => setShowHistory((v) => !v)} className="font-heading text-base font-medium text-foreground">
          Histórico de Publicações {showHistory ? "▾" : "▸"}
        </button>
        {showHistory ? (
          <div className="mt-4 overflow-x-auto">
            {history.length === 0 ? (
              <p className="text-sm text-foreground/40">Sem registos de histórico ainda.</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border-subtle text-xs uppercase tracking-wide text-foreground/40">
                    <th className="py-2 pr-4 font-medium">Data/Hora</th>
                    <th className="py-2 pr-4 font-medium">Administrador</th>
                    <th className="py-2 font-medium">Acção</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((row) => (
                    <tr key={row.id} className="border-b border-border-subtle/60">
                      <td className="py-2 pr-4 text-foreground/70">{formatDateTime(row.createdAt)}</td>
                      <td className="py-2 pr-4 text-foreground/70">{row.user?.name ?? "—"}</td>
                      <td className="py-2 text-foreground/70">{ACTION_LABEL[row.action] ?? row.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {historyPagination && historyPagination.total > history.length ? (
              <p className="mt-2 text-xs text-foreground/40">A mostrar {history.length} de {historyPagination.total} registos.</p>
            ) : null}
          </div>
        ) : null}
      </section>

      <LatestNewsSelectModal open={modalTarget !== null} onClose={() => setModalTarget(null)} onSelect={handleSelect} excludeIds={modalTarget === "BREAKING" ? [] : excludeIds} />

      {previewOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl bg-surface-muted shadow-xl">
            <div className="flex items-center justify-between border-b border-border-subtle bg-surface px-5 py-4">
              <h2 className="font-heading text-lg font-medium text-foreground">Pré-visualizar Homepage</h2>
              <button type="button" onClick={() => setPreviewOpen(false)} aria-label="Fechar" className="rounded-full p-1.5 text-foreground/50 hover:bg-surface-muted hover:text-foreground">
                <HiOutlineXMark className="size-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-6">
              {showBreakingBar && breakingPreviewNews ? <BreakingStrip news={[breakingPreviewNews]} /> : null}
              {mainNews ? (
                <FeaturedBlock main={mainNews} secondary={secondaryNews} />
              ) : (
                <p className="py-10 text-center text-sm text-foreground/40">Seleccione uma notícia principal para pré-visualizar.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {confirmPublishOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-surface p-6 shadow-xl">
            <p className="text-sm font-medium text-foreground">Tem certeza de que deseja publicar esta configuração na homepage?</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmPublishOpen(false)} className="rounded-lg border border-border-subtle px-4 py-2 text-sm font-medium text-foreground">
                Cancelar
              </button>
              <button type="button" disabled={publishing} onClick={handlePublish} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50">
                {publishing ? "A publicar..." : "Publicar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
