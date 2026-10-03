"use client";

import { useMemo, useState } from "react";
import { HiOutlineArrowDownTray, HiOutlineDocumentText, HiOutlineEye, HiOutlineMagnifyingGlass } from "react-icons/hi2";
import type { Category, EndiamaDocument } from "@/domain/entities";
import { formatDate, formatFileSize } from "@/lib/format";
import { apiPost } from "@/infrastructure/api/http-client";

async function handleDownload(document: EndiamaDocument) {
  try {
    const result = await apiPost<{ fileUrl: string }>(`/public/documents/${document.id}/download`);
    window.open(result.fileUrl, "_blank", "noopener,noreferrer");
  } catch {
    window.open(document.downloadUrl, "_blank", "noopener,noreferrer");
  }
}

export function DocumentsExplorer({ documents, categories }: { documents: EndiamaDocument[]; categories: Category[] }) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("todas");

  const filtered = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch = search.trim() === "" || doc.title.toLowerCase().includes(search.trim().toLowerCase());
      const matchesCategory = activeCategory === "todas" || doc.category?.slug === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [documents, search, activeCategory]);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <HiOutlineMagnifyingGlass className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-foreground/40" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar documentos…"
            className="w-full rounded-full border border-border-subtle bg-surface py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-foreground/40 focus:border-brand-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="scrollbar-hide -mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-2">
        <FilterPill active={activeCategory === "todas"} onClick={() => setActiveCategory("todas")} label="Todas" />
        {categories.map((category) => (
          <FilterPill
            key={category.id}
            active={activeCategory === category.slug}
            onClick={() => setActiveCategory(category.slug)}
            label={category.name}
          />
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-sm text-foreground/50">Nenhum documento encontrado.</p>
      ) : (
        <div className="mt-8 overflow-hidden rounded-2xl border border-border-subtle">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border-subtle bg-surface-muted text-xs uppercase tracking-wide text-foreground/50">
                <th className="px-5 py-3 font-medium">Documento</th>
                <th className="px-5 py-3 font-medium">Categoria</th>
                <th className="px-5 py-3 font-medium">Data</th>
                <th className="px-5 py-3 font-medium">Formato</th>
                <th className="px-5 py-3 font-medium">Tamanho</th>
                <th className="px-5 py-3 font-medium text-right">Acções</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc) => (
                <tr key={doc.id} className="border-b border-border-subtle last:border-0 hover:bg-surface-muted/60">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-600/10 text-brand-600 dark:text-brand-400">
                        <HiOutlineDocumentText className="size-4.5" />
                      </span>
                      <div className="min-w-0">
                        <p className="line-clamp-1 font-medium text-foreground">{doc.title}</p>
                        {doc.description ? <p className="line-clamp-1 text-xs text-foreground/50">{doc.description}</p> : null}
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-foreground/70">{doc.category?.name ?? "—"}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-foreground/70">{formatDate(doc.documentDate ?? doc.publishedAt)}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-foreground/70">{doc.fileType}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-foreground/70">{formatFileSize(doc.fileSizeKB)}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={doc.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Visualizar"
                        className="inline-flex size-8 items-center justify-center rounded-full border border-border-subtle text-foreground/60 transition-colors hover:border-brand-500 hover:text-brand-600"
                      >
                        <HiOutlineEye className="size-4" />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleDownload(doc)}
                        aria-label="Baixar"
                        className="inline-flex size-8 items-center justify-center rounded-full border border-border-subtle text-foreground/60 transition-colors hover:border-brand-500 hover:text-brand-600"
                      >
                        <HiOutlineArrowDownTray className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FilterPill({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
        active ? "bg-brand-600 text-white" : "bg-surface-muted text-foreground/60 hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}
