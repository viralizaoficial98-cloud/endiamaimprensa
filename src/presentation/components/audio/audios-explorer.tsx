"use client";

import { useMemo, useState } from "react";
import { HiOutlineMagnifyingGlass } from "react-icons/hi2";
import type { Category, EndiamaAudio } from "@/domain/entities";
import { RevealGroup } from "@/presentation/components/ui/reveal";
import { AudioCard } from "./audio-card";

export function AudiosExplorer({ audios, categories }: { audios: EndiamaAudio[]; categories: Category[] }) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("todas");

  const filtered = useMemo(() => {
    return audios.filter((audio) => {
      const matchesSearch = search.trim() === "" || audio.title.toLowerCase().includes(search.trim().toLowerCase());
      const matchesCategory = activeCategory === "todas" || audio.category?.slug === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [audios, search, activeCategory]);

  return (
    <div>
      <div className="relative">
        <HiOutlineMagnifyingGlass className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-foreground/40" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar áudios…"
          className="w-full rounded-full border border-border-subtle bg-surface py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-foreground/40 focus:border-brand-500 focus:outline-none"
        />
      </div>

      <div className="scrollbar-hide -mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-2">
        <FilterPill active={activeCategory === "todas"} onClick={() => setActiveCategory("todas")} label="Todos" />
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
        <p className="py-16 text-center text-sm text-foreground/50">Nenhum áudio encontrado.</p>
      ) : (
        <RevealGroup className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" stagger={0.06}>
          {filtered.map((audio) => (
            <AudioCard key={audio.id} audio={audio} />
          ))}
        </RevealGroup>
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
