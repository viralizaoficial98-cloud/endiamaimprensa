"use client";

import { useEffect, useRef, useState } from "react";
import { HiOutlineArrowPath, HiOutlineMagnifyingGlass } from "react-icons/hi2";
import type { GalleryAlbumSummary, GalleryCategory } from "@/domain/entities";
import type { PaginationMeta } from "@/domain/shared/pagination";
import { listGalleryAlbums } from "@/application/use-cases/gallery-use-cases";
import { RevealGroup, RevealItem } from "@/presentation/components/ui/reveal";
import { fadeUp } from "@/presentation/animations/variants";
import { GalleryAlbumCard } from "./gallery-album-card";

const PAGE_SIZE = 12;

export function GalleryAlbumExplorer({
  initialAlbums,
  initialPagination,
  categories,
}: {
  initialAlbums: GalleryAlbumSummary[];
  initialPagination: PaginationMeta;
  categories: GalleryCategory[];
}) {
  const [albums, setAlbums] = useState(initialAlbums);
  const [pagination, setPagination] = useState(initialPagination);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [subcategory, setSubcategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const isFirstRender = useRef(true);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentCategory = categories.find((c) => c.slug === category);

  async function fetchPage(page: number, append: boolean) {
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError(false);
    try {
      const result = await listGalleryAlbums({
        page,
        limit: PAGE_SIZE,
        search: search.trim() || undefined,
        galleryCategory: category ?? undefined,
        gallerySubcategory: subcategory ?? undefined,
      });
      setAlbums((prev) => (append ? [...prev, ...result.data] : result.data));
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
  }, [category, subcategory]);

  function handleSearchChange(value: string) {
    setSearch(value);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => fetchPage(1, false), 350);
  }

  return (
    <div>
      <div className="relative max-w-md">
        <HiOutlineMagnifyingGlass className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-foreground/40" />
        <input
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Pesquisar galerias..."
          className="w-full rounded-full border border-border-subtle bg-surface py-2.5 pl-11 pr-4 text-sm outline-none transition-colors focus:border-brand-500"
        />
      </div>

      <div className="scrollbar-hide -mx-1 mt-5 flex gap-2 overflow-x-auto px-1 pb-1">
        <FilterPill
          active={category === null}
          onClick={() => {
            setCategory(null);
            setSubcategory(null);
          }}
          label="Todas"
        />
        {categories.map((c) => (
          <FilterPill
            key={c.id}
            active={category === c.slug}
            onClick={() => {
              setCategory(c.slug);
              setSubcategory(null);
            }}
            label={c.name}
          />
        ))}
      </div>

      {currentCategory && currentCategory.subcategories.length > 0 ? (
        <div className="scrollbar-hide -mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1">
          <FilterPill active={subcategory === null} onClick={() => setSubcategory(null)} label="Todas" subtle />
          {currentCategory.subcategories.map((sub) => (
            <FilterPill key={sub.id} active={subcategory === sub.slug} onClick={() => setSubcategory(sub.slug)} label={sub.name} subtle />
          ))}
        </div>
      ) : null}

      <div className="mt-8">
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[4/3] animate-pulse rounded-2xl bg-surface-muted" />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-border-subtle py-16 text-center">
            <p className="text-sm text-foreground/60">Não foi possível carregar as galerias neste momento.</p>
            <button
              type="button"
              onClick={() => fetchPage(1, false)}
              className="inline-flex items-center gap-2 rounded-full border border-border-subtle px-5 py-2 text-sm font-semibold text-foreground/70 transition-colors hover:border-brand-500 hover:text-brand-600"
            >
              <HiOutlineArrowPath className="size-4" />
              Tentar novamente
            </button>
          </div>
        ) : albums.length === 0 ? (
          <p className="py-16 text-center text-sm text-foreground/50">Nenhuma galeria encontrada.</p>
        ) : (
          <RevealGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" stagger={0.05}>
            {albums.map((album, i) => (
              <RevealItem key={album.id} variants={fadeUp}>
                <GalleryAlbumCard album={album} priority={i < 3} />
              </RevealItem>
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
              "Carregar mais galerias"
            )}
          </button>
        </div>
      ) : null}
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
      } ${
        active
          ? subtle
            ? "bg-gold-500 text-brand-950"
            : "bg-brand-600 text-white"
          : "bg-surface-muted text-foreground/60 hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}
