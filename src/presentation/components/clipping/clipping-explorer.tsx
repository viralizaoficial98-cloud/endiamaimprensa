"use client";

import { useMemo, useState } from "react";
import { HiOutlineDocumentArrowDown, HiOutlineLink, HiOutlineMagnifyingGlass, HiOutlineNewspaper } from "react-icons/hi2";
import type { Category, Clipping, ClippingMediaType } from "@/domain/entities";
import { formatDate } from "@/lib/format";

const MEDIA_TYPE_LABELS: Record<ClippingMediaType, string> = {
  IMPRENSA_ESCRITA: "Imprensa Escrita",
  TELEVISAO: "Televisão",
  RADIO: "Rádio",
  PORTAL_DIGITAL: "Portal Digital",
  PUBLICACAO_ONLINE: "Publicação Online",
};

const MEDIA_TYPES = Object.keys(MEDIA_TYPE_LABELS) as ClippingMediaType[];

export function ClippingExplorer({ items, categories }: { items: Clipping[]; categories: Category[] }) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("todas");
  const [activeMediaType, setActiveMediaType] = useState<ClippingMediaType | "todos">("todos");

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        search.trim() === "" ||
        item.title.toLowerCase().includes(search.trim().toLowerCase()) ||
        item.source.toLowerCase().includes(search.trim().toLowerCase());
      const matchesCategory = activeCategory === "todas" || item.category?.slug === activeCategory;
      const matchesMediaType = activeMediaType === "todos" || item.mediaType === activeMediaType;
      return matchesSearch && matchesCategory && matchesMediaType;
    });
  }, [items, search, activeCategory, activeMediaType]);

  return (
    <div>
      <div className="relative">
        <HiOutlineMagnifyingGlass className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-foreground/40" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar por título ou fonte…"
          className="w-full rounded-full border border-border-subtle bg-surface py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-foreground/40 focus:border-brand-500 focus:outline-none"
        />
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <div className="scrollbar-hide -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          <FilterPill active={activeCategory === "todas"} onClick={() => setActiveCategory("todas")} label="Todas as categorias" />
          {categories.map((category) => (
            <FilterPill
              key={category.id}
              active={activeCategory === category.slug}
              onClick={() => setActiveCategory(category.slug)}
              label={category.name}
            />
          ))}
        </div>
        <div className="scrollbar-hide -mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
          <FilterPill active={activeMediaType === "todos"} onClick={() => setActiveMediaType("todos")} label="Todos os tipos" subtle />
          {MEDIA_TYPES.map((type) => (
            <FilterPill
              key={type}
              active={activeMediaType === type}
              onClick={() => setActiveMediaType(type)}
              label={MEDIA_TYPE_LABELS[type]}
              subtle
            />
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-sm text-foreground/50">Nenhum registo de clipping encontrado.</p>
      ) : (
        <div className="mt-6 space-y-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-3 rounded-2xl border border-border-subtle bg-surface p-5 transition-all hover:border-brand-500/30 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-start gap-4">
                <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-600/10 text-brand-600 dark:text-brand-400">
                  <HiOutlineNewspaper className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="line-clamp-2 font-heading text-sm font-medium text-foreground">{item.title}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-foreground/50">
                    <span>{item.source}</span>
                    <span>·</span>
                    <span>{formatDate(item.clippingDate)}</span>
                    <span>·</span>
                    <span>{MEDIA_TYPE_LABELS[item.mediaType]}</span>
                    {item.category ? (
                      <>
                        <span>·</span>
                        <span>{item.category.name}</span>
                      </>
                    ) : null}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2 sm:ml-4">
                {item.url ? (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle px-3.5 py-1.5 text-xs font-medium text-foreground/70 transition-colors hover:border-brand-500 hover:text-brand-600"
                  >
                    <HiOutlineLink className="size-3.5" /> Ver Fonte
                  </a>
                ) : null}
                {item.documentUrl ? (
                  <a
                    href={item.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle px-3.5 py-1.5 text-xs font-medium text-foreground/70 transition-colors hover:border-brand-500 hover:text-brand-600"
                  >
                    <HiOutlineDocumentArrowDown className="size-3.5" /> Documento
                  </a>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterPill({ active, onClick, label, subtle }: { active: boolean; onClick: () => void; label: string; subtle?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 whitespace-nowrap rounded-full font-medium transition-colors ${
        subtle ? "px-3.5 py-1.5 text-xs" : "px-4 py-2 text-sm"
      } ${active ? (subtle ? "bg-gold-500 text-brand-950" : "bg-brand-600 text-white") : "bg-surface-muted text-foreground/60 hover:text-foreground"}`}
    >
      {label}
    </button>
  );
}
