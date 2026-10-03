"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { HiOutlineBars3, HiOutlinePencil } from "react-icons/hi2";
import { adminDelete, adminGet, adminPatch, adminPost } from "@/infrastructure/api/admin-http-client";
import { revalidateContentCache } from "@/infrastructure/api/revalidate-client";
import { describeError } from "@/presentation/admin/news-form";

interface BannerRow {
  id: string;
  title: string;
  subtitle: string | null;
  image: string;
  category: { id: string; name: string } | null;
  news: { id: string; title: string; slug: string } | null;
  order: number;
  status: "ACTIVE" | "INACTIVE";
  startsAt: string | null;
  endsAt: string | null;
}

interface CategoryOption {
  id: string;
  name: string;
}

function setFlashRead(): string | null {
  try {
    const v = sessionStorage.getItem("admin_flash");
    if (v) sessionStorage.removeItem("admin_flash");
    return v;
  } catch {
    return null;
  }
}

export default function AdminBannersPage() {
  const [rows, setRows] = useState<BannerRow[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"" | "ACTIVE" | "INACTIVE">("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [search, setSearch] = useState("");
  const [flash, setFlash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const dragIndex = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [bannersRes, categoriesRes] = await Promise.all([
        adminGet<BannerRow[]>("/admin/banners"),
        adminGet<CategoryOption[]>("/admin/categories?limit=50").catch(() => []),
      ]);
      setRows(bannersRes);
      setCategories(categoriesRes);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    setFlash(setFlashRead());
  }, []);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (statusFilter && r.status !== statusFilter) return false;
      if (categoryFilter && r.category?.id !== categoryFilter) return false;
      if (search.trim() && !r.title.toLowerCase().includes(search.trim().toLowerCase())) return false;
      return true;
    });
  }, [rows, statusFilter, categoryFilter, search]);

  const stats = useMemo(
    () => ({
      total: rows.length,
      active: rows.filter((r) => r.status === "ACTIVE").length,
      inactive: rows.filter((r) => r.status === "INACTIVE").length,
    }),
    [rows]
  );

  async function toggleStatus(row: BannerRow) {
    const nextStatus = row.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, status: nextStatus } : r)));
    try {
      await adminPatch(`/admin/banners/${row.id}`, { status: nextStatus });
      await revalidateContentCache(["banners"]);
    } catch (err) {
      setError(describeError(err, "Falha ao actualizar estado."));
      load();
    }
  }

  async function handleDelete(row: BannerRow) {
    if (!window.confirm(`Tem certeza de que pretende eliminar o banner "${row.title}"?`)) return;
    try {
      await adminDelete(`/admin/banners/${row.id}`);
      await revalidateContentCache(["banners"]);
      load();
    } catch (err) {
      setError(describeError(err, "Falha ao eliminar banner."));
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
    if (from === null || from === index) return;

    const reordered = [...filtered];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(index, 0, moved);
    const withNewOrder = reordered.map((r, i) => ({ ...r, order: i }));

    // Merge back into the full (unfiltered) rows list so filters don't drop items.
    setRows((prev) => {
      const byId = new Map(withNewOrder.map((r) => [r.id, r]));
      return prev.map((r) => byId.get(r.id) ?? r).sort((a, b) => a.order - b.order);
    });

    try {
      await adminPost("/admin/banners/reorder", { order: withNewOrder.map((r) => ({ id: r.id, order: r.order })) });
      await revalidateContentCache(["banners"]);
    } catch (err) {
      setError(describeError(err, "Falha ao reordenar banners."));
      load();
    }
  }

  const noFilters = !statusFilter && !categoryFilter && !search.trim();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-medium text-foreground">Banners</h1>
          <p className="mt-1 text-sm text-foreground/50">Gestão do slideshow principal da homepage.</p>
        </div>
        <Link href="/admin/banners/new" className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
          Novo Banner
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3 sm:max-w-md">
        <div className="rounded-xl border border-border-subtle bg-surface p-4">
          <p className="text-2xl font-semibold text-foreground">{stats.total}</p>
          <p className="text-xs text-foreground/50">Total</p>
        </div>
        <div className="rounded-xl border border-border-subtle bg-surface p-4">
          <p className="text-2xl font-semibold text-brand-600">{stats.active}</p>
          <p className="text-xs text-foreground/50">Activos</p>
        </div>
        <div className="rounded-xl border border-border-subtle bg-surface p-4">
          <p className="text-2xl font-semibold text-foreground/40">{stats.inactive}</p>
          <p className="text-xs text-foreground/50">Inactivos</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar por título..."
          className="w-64 rounded-lg border border-border-subtle bg-surface px-3.5 py-2 text-sm outline-none focus:border-brand-500"
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="rounded-lg border border-border-subtle bg-surface px-3.5 py-2 text-sm outline-none focus:border-brand-500">
          <option value="">Todos os estados</option>
          <option value="ACTIVE">Activo</option>
          <option value="INACTIVE">Inactivo</option>
        </select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="rounded-lg border border-border-subtle bg-surface px-3.5 py-2 text-sm outline-none focus:border-brand-500">
          <option value="">Todas as categorias</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {flash ? (
        <p className="mt-4 flex items-center justify-between rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800 dark:border-brand-800/50 dark:bg-brand-950/30 dark:text-brand-300">
          {flash}
          <button type="button" onClick={() => setFlash(null)} className="text-xs font-medium underline">
            Fechar
          </button>
        </p>
      ) : null}
      {error ? <p className="mt-4 text-sm text-red-500">{error}</p> : null}
      {!noFilters ? <p className="mt-4 text-xs text-foreground/45">Arrastar para reordenar só funciona sem filtros activos.</p> : null}

      <div className="mt-4 space-y-2">
        {loading ? (
          <p className="text-sm text-foreground/40">A carregar...</p>
        ) : filtered.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border-subtle py-10 text-center text-sm text-foreground/40">Nenhum banner encontrado.</p>
        ) : (
          filtered.map((row, index) => (
            <div
              key={row.id}
              draggable={noFilters}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(index, e)}
              onDrop={() => handleDrop(index)}
              className={`flex items-center gap-3 rounded-xl border bg-surface p-3 transition-colors ${
                dragOverIndex === index ? "border-brand-500 bg-brand-600/5" : "border-border-subtle"
              }`}
            >
              {noFilters ? (
                <span className="cursor-grab text-foreground/30" title="Arrastar para reordenar">
                  <HiOutlineBars3 className="size-4.5" />
                </span>
              ) : (
                <span className="size-4.5" />
              )}
              <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-lg bg-surface-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={row.image} alt={row.title} className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{row.title}</p>
                <p className="truncate text-xs text-foreground/50">
                  {row.category?.name ?? "Sem categoria"}
                  {row.news ? ` · ligado a "${row.news.title}"` : " · conteúdo personalizado"}
                  {row.startsAt || row.endsAt ? " · agendado" : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => toggleStatus(row)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium ${row.status === "ACTIVE" ? "bg-brand-600/10 text-brand-700" : "bg-foreground/10 text-foreground/50"}`}
                >
                  {row.status === "ACTIVE" ? "Activo" : "Inactivo"}
                </button>
                <Link href={`/admin/banners/${row.id}`} aria-label="Editar" className="inline-flex size-8 items-center justify-center rounded-md border border-border-subtle text-foreground/60 hover:border-brand-500 hover:text-brand-600">
                  <HiOutlinePencil className="size-4" />
                </Link>
                <button type="button" onClick={() => handleDelete(row)} className="text-xs font-medium text-red-500 hover:underline">
                  Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
