import { motion } from "framer-motion";
import Image from "next/image";
import { HiOutlineArrowTopRightOnSquare, HiOutlineNewspaper } from "react-icons/hi2";
import type { HistoricalNews } from "@/domain/entities";
import { formatDate } from "@/lib/format";
import { fadeUp } from "@/presentation/animations/variants";

/** Historical posts live only on the old WordPress site — there is no local
 * detail page for them, so the whole card opens the original article. */
export function HistoricalNewsCard({ news, priority = false }: { news: HistoricalNews; priority?: boolean }) {
  return (
    <motion.a
      href={news.sourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      variants={fadeUp}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border-subtle bg-surface transition-all hover:-translate-y-1 hover:border-brand-500/40 hover:shadow-lg"
    >
      <div className="relative aspect-video w-full shrink-0 overflow-hidden bg-surface-muted">
        {news.image ? (
          <Image
            src={news.image.url}
            alt={news.image.alt}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-foreground/20">
            <HiOutlineNewspaper className="size-10" />
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
          Arquivo Histórico
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-[11px] font-medium text-foreground/40">{formatDate(news.publishedAt)}</p>
        <h3 className="line-clamp-2 font-heading text-sm font-medium text-foreground">{news.title}</h3>
        <p className="line-clamp-2 flex-1 text-xs text-foreground/55">{news.excerpt}</p>
        <span className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400">
          Ler notícia original
          <HiOutlineArrowTopRightOnSquare className="size-3.5" />
        </span>
      </div>
    </motion.a>
  );
}
