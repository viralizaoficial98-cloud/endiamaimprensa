"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { HiOutlineArrowUpRight, HiOutlineVideoCamera } from "react-icons/hi2";
import type { News } from "@/domain/entities";
import { fadeUp } from "@/presentation/animations/variants";
import { CategoryBadge } from "@/presentation/components/ui/category-badge";
import { PublishedAt, ReadTime, ViewCount } from "@/presentation/components/ui/meta";

const NEW_THRESHOLD_MS = 24 * 60 * 60 * 1000;

function isNew(publishedAt: string): boolean {
  return Date.now() - new Date(publishedAt).getTime() < NEW_THRESHOLD_MS;
}

export type NewsGridCardVariant = "image" | "horizontal" | "text";

export function NewsGridCard({ news, variant = "image", priority = false }: { news: News; variant?: NewsGridCardVariant; priority?: boolean }) {
  if (variant === "horizontal") return <HorizontalCompactCard news={news} priority={priority} />;
  if (variant === "text") return <TextOnlyCard news={news} />;
  return <VerticalImageCard news={news} priority={priority} />;
}

function VerticalImageCard({ news, priority }: { news: News; priority?: boolean }) {
  const hasVideo = Boolean(news.relatedVideoIds?.length);

  return (
    <motion.article
      variants={fadeUp}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border-subtle bg-surface transition-all duration-300 hover:-translate-y-1 hover:border-brand-500/30 hover:shadow-lg hover:shadow-brand-900/10"
    >
      <div className="relative block aspect-video overflow-hidden">
        <Link href={`/noticia/${news.slug}`} className="absolute inset-0 z-0 block">
          <Image
            src={news.coverImage}
            alt={news.coverImageAlt}
            fill
            priority={priority}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/0 to-black/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          {hasVideo ? (
            <span className="absolute inset-0 flex items-center justify-center bg-black/20">
              <HiOutlineVideoCamera className="size-8 text-white drop-shadow" />
            </span>
          ) : null}
        </Link>
        <div className="absolute left-3 top-3 z-10 flex items-center gap-2">
          <CategoryBadge name={news.category.name} slug={news.category.slug} />
          {isNew(news.publishedAt) ? (
            <span className="rounded-full bg-gold-500 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-brand-950">Novo</span>
          ) : null}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <Link href={`/noticia/${news.slug}`} className="inline-flex items-start gap-1.5">
          <h3 className="font-heading text-base font-medium leading-snug text-foreground transition-colors group-hover:text-brand-600 dark:group-hover:text-brand-400">
            {news.title}
          </h3>
          <HiOutlineArrowUpRight className="mt-1.5 size-3.5 shrink-0 -translate-x-1 text-brand-600 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 dark:text-brand-400" />
        </Link>
        <p className="mt-1.5 line-clamp-2 text-sm text-foreground/60">{news.excerpt}</p>
        <div className="mt-auto flex items-center justify-end pt-3 text-xs text-foreground/50">
          <div className="flex shrink-0 items-center gap-3">
            <ReadTime minutes={news.readTimeMinutes} />
            <ViewCount views={news.views} />
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function HorizontalCompactCard({ news, priority }: { news: News; priority?: boolean }) {
  const hasVideo = Boolean(news.relatedVideoIds?.length);

  return (
    <motion.article
      variants={fadeUp}
      className="group flex h-full items-center gap-4 overflow-hidden rounded-2xl border border-border-subtle bg-surface p-3 transition-all duration-300 hover:-translate-y-1 hover:border-brand-500/30 hover:shadow-lg hover:shadow-brand-900/10"
    >
      <Link href={`/noticia/${news.slug}`} className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-xl sm:w-32">
        <Image src={news.coverImage} alt={news.coverImageAlt} fill priority={priority} sizes="128px" className="object-cover transition-transform duration-300 group-hover:scale-105" />
        {hasVideo ? (
          <span className="absolute inset-0 flex items-center justify-center bg-black/25">
            <HiOutlineVideoCamera className="size-5 text-white" />
          </span>
        ) : null}
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <CategoryBadge name={news.category.name} slug={news.category.slug} />
          {isNew(news.publishedAt) ? <span className="text-[10px] font-bold uppercase tracking-wide text-gold-500">Novo</span> : null}
        </div>
        <Link href={`/noticia/${news.slug}`} className="inline-flex items-start gap-1">
          <h4 className="mt-1.5 line-clamp-2 font-heading text-sm font-medium leading-snug text-foreground transition-colors group-hover:text-brand-600 dark:group-hover:text-brand-400">
            {news.title}
          </h4>
          <HiOutlineArrowUpRight className="mt-2 size-3 shrink-0 -translate-x-1 text-brand-600 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 dark:text-brand-400" />
        </Link>
        <div className="mt-1.5 flex items-center gap-3 text-[11px] text-foreground/50">
          <ReadTime minutes={news.readTimeMinutes} />
          <PublishedAt iso={news.publishedAt} />
        </div>
      </div>
    </motion.article>
  );
}

function TextOnlyCard({ news }: { news: News }) {
  return (
    <motion.article
      variants={fadeUp}
      className="group flex h-full flex-col justify-between rounded-2xl border border-border-subtle bg-surface p-4 transition-all duration-300 hover:-translate-y-1 hover:border-brand-500/30 hover:shadow-lg hover:shadow-brand-900/10"
    >
      <div>
        <div className="flex items-center gap-2">
          <CategoryBadge name={news.category.name} slug={news.category.slug} />
          {isNew(news.publishedAt) ? <span className="text-[10px] font-bold uppercase tracking-wide text-gold-500">Novo</span> : null}
        </div>
        <Link href={`/noticia/${news.slug}`} className="inline-flex items-start gap-1.5">
          <h4 className="mt-2.5 font-heading text-lg font-medium leading-snug text-foreground transition-colors group-hover:text-brand-600 dark:group-hover:text-brand-400">
            {news.title}
          </h4>
          <HiOutlineArrowUpRight className="mt-2 size-3.5 shrink-0 -translate-x-1 text-brand-600 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 dark:text-brand-400" />
        </Link>
      </div>
      <div className="mt-4 flex items-center gap-3 text-xs text-foreground/50">
        <ReadTime minutes={news.readTimeMinutes} />
        <ViewCount views={news.views} />
        <PublishedAt iso={news.publishedAt} />
      </div>
    </motion.article>
  );
}

export function pickCardVariant(index: number): NewsGridCardVariant {
  const cycle = index % 5;
  if (cycle === 2) return "horizontal";
  if (cycle === 4) return "text";
  return "image";
}
