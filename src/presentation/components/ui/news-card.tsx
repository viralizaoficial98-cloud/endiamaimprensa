"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { HiOutlineArrowUpRight } from "react-icons/hi2";
import type { News } from "@/domain/entities";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { scaleIn } from "@/presentation/animations/variants";
import { BookmarkButton } from "./bookmark-button";
import { CategoryBadge } from "./category-badge";
import { PublishedAt, ReadTime, ViewCount } from "./meta";
import { ShareButton } from "./share-button";

interface NewsCardProps {
  news: News;
  variant?: "default" | "featured" | "compact" | "horizontal";
  priority?: boolean;
  className?: string;
}

export function NewsCard({ news, variant = "default", priority = false, className }: NewsCardProps) {
  if (variant === "featured") return <FeaturedNewsCard news={news} priority={priority} className={className} />;
  if (variant === "compact") return <CompactNewsCard news={news} className={className} />;
  if (variant === "horizontal") return <HorizontalNewsCard news={news} className={className} />;

  return (
    <motion.article
      variants={scaleIn}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border-subtle bg-surface shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-500/30 hover:shadow-lg hover:shadow-brand-900/10",
        className
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Link href={`/noticia/${news.slug}`} className="absolute inset-0 z-0 block">
          <Image
            src={news.coverImage}
            alt={news.coverImageAlt}
            fill
            priority={priority}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        </Link>
        <div className="absolute left-4 top-4 z-10">
          <CategoryBadge name={news.category.name} slug={news.category.slug} />
        </div>
        <div className="absolute right-4 top-4 z-10 flex translate-y-1 gap-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <BookmarkButton />
          <ShareButton title={news.title} />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <Link href={`/noticia/${news.slug}`} className="group/title inline-flex items-start gap-1.5">
          <h3 className="font-heading text-lg font-medium leading-snug text-foreground transition-colors group-hover:text-brand-600 dark:group-hover:text-brand-400">
            {news.title}
          </h3>
          <HiOutlineArrowUpRight className="mt-1.5 size-3.5 shrink-0 -translate-x-1 text-brand-600 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 dark:text-brand-400" />
        </Link>
        <p className="mt-2 line-clamp-2 text-sm text-foreground/60">{news.excerpt}</p>
        <div className="mt-auto flex items-center justify-end pt-4 text-xs text-foreground/50">
          <div className="flex shrink-0 items-center gap-3">
            <ReadTime minutes={news.readTimeMinutes} />
            <ViewCount views={news.views} />
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function FeaturedNewsCard({ news, priority, className }: { news: News; priority?: boolean; className?: string }) {
  return (
    <motion.article
      variants={scaleIn}
      className={cn(
        "group relative flex h-full min-h-[340px] flex-col justify-end overflow-hidden rounded-3xl shadow-lg",
        className
      )}
    >
      <Link href={`/noticia/${news.slug}`} className="absolute inset-0">
        <Image
          src={news.coverImage}
          alt={news.coverImageAlt}
          fill
          priority={priority}
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/5" />
      </Link>
      <div className="relative z-10 p-6 sm:p-8">
        <CategoryBadge name={news.category.name} slug={news.category.slug} />
        <Link href={`/noticia/${news.slug}`}>
          <h3 className="mt-4 font-heading text-2xl font-medium leading-tight text-white sm:text-3xl">
            {news.title}
          </h3>
        </Link>
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-white/70">
          <PublishedAt iso={news.publishedAt} />
          <ReadTime minutes={news.readTimeMinutes} />
        </div>
      </div>
    </motion.article>
  );
}

function CompactNewsCard({ news, className }: { news: News; className?: string }) {
  return (
    <motion.article variants={scaleIn} className={cn("group flex items-center gap-4", className)}>
      <Link href={`/noticia/${news.slug}`} className="relative size-20 shrink-0 overflow-hidden rounded-xl">
        <Image
          src={news.coverImage}
          alt={news.coverImageAlt}
          fill
          sizes="80px"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </Link>
      <div className="min-w-0">
        <CategoryBadge name={news.category.name} slug={news.category.slug} className="mb-1.5" />
        <Link href={`/noticia/${news.slug}`}>
          <h4 className="line-clamp-2 font-heading text-sm font-medium leading-snug text-foreground transition-colors group-hover:text-brand-600 dark:group-hover:text-brand-400">
            {news.title}
          </h4>
        </Link>
        <div className="mt-1.5 flex items-center gap-3 text-[11px] text-foreground/50">
          <ViewCount views={news.views} />
          <ReadTime minutes={news.readTimeMinutes} />
          <span>{formatRelativeTime(news.publishedAt)}</span>
        </div>
      </div>
    </motion.article>
  );
}

function HorizontalNewsCard({ news, className }: { news: News; className?: string }) {
  return (
    <motion.article
      variants={scaleIn}
      className={cn(
        "group flex gap-5 overflow-hidden rounded-2xl border border-border-subtle bg-surface p-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg",
        className
      )}
    >
      <Link href={`/noticia/${news.slug}`} className="relative aspect-[4/3] w-40 shrink-0 overflow-hidden rounded-xl sm:w-52">
        <Image
          src={news.coverImage}
          alt={news.coverImageAlt}
          fill
          sizes="200px"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col py-1">
        <CategoryBadge name={news.category.name} slug={news.category.slug} className="w-fit" />
        <Link href={`/noticia/${news.slug}`}>
          <h3 className="mt-2 line-clamp-2 font-heading text-base font-medium leading-snug text-foreground transition-colors group-hover:text-brand-600 dark:group-hover:text-brand-400 sm:text-lg">
            {news.title}
          </h3>
        </Link>
        <p className="mt-1 line-clamp-1 text-sm text-foreground/60 sm:line-clamp-2">{news.excerpt}</p>
        <div className="mt-auto flex items-center gap-3 pt-2 text-xs text-foreground/50">
          <ReadTime minutes={news.readTimeMinutes} />
          <PublishedAt iso={news.publishedAt} />
        </div>
      </div>
    </motion.article>
  );
}
