"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { HiOutlineMagnifyingGlass, HiXMark } from "react-icons/hi2";
import type { News } from "@/domain/entities";
import { searchNews } from "@/application/use-cases/news-use-cases";
import { formatRelativeTime } from "@/lib/format";

export function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations();
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<News[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    const timeout = setTimeout(() => {
      searchNews(query, 8, locale).then((news) => {
        setResults(news);
        setLoading(false);
      });
    }, 180);
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: -24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -24, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-x-0 top-20 z-[90] mx-auto w-full max-w-2xl px-4"
          >
            <div className="overflow-hidden rounded-2xl border border-border-subtle bg-surface shadow-2xl">
              <div className="flex items-center gap-3 border-b border-border-subtle px-5 py-4">
                <HiOutlineMagnifyingGlass className="size-5 shrink-0 text-foreground/40" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("search.modalPlaceholder")}
                  className="w-full bg-transparent text-base text-foreground outline-none placeholder:text-foreground/40"
                />
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={t("search.close")}
                  className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-foreground/50 hover:bg-surface-muted"
                >
                  <HiXMark className="size-4" />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto p-2">
                {loading ? (
                  <div className="space-y-2 p-3">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="shimmer h-16 rounded-xl" />
                    ))}
                  </div>
                ) : results.length > 0 ? (
                  results.map((news) => (
                    <Link
                      key={news.id}
                      href={`/noticia/${news.slug}`}
                      onClick={onClose}
                      className="flex items-center gap-4 rounded-xl p-3 transition-colors hover:bg-surface-muted"
                    >
                      <div className="relative size-14 shrink-0 overflow-hidden rounded-lg">
                        <Image src={news.coverImage} alt={news.coverImageAlt} fill sizes="56px" className="object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="line-clamp-1 font-heading text-sm font-medium text-foreground">{news.title}</p>
                        <p className="mt-0.5 text-xs text-foreground/50">
                          {news.category.name} · {formatRelativeTime(news.publishedAt)}
                        </p>
                      </div>
                    </Link>
                  ))
                ) : query.trim() ? (
                  <p className="p-6 text-center text-sm text-foreground/50">{t("search.noResultsFor", { query })}</p>
                ) : (
                  <p className="p-6 text-center text-sm text-foreground/50">{t("search.startTyping")}</p>
                )}
              </div>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
