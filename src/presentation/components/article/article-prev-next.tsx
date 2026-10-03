import Image from "next/image";
import Link from "next/link";
import { HiOutlineArrowLeft, HiOutlineArrowRight } from "react-icons/hi2";
import type { News } from "@/domain/entities";

export function ArticlePrevNext({ previous, next }: { previous: News | null; next: News | null }) {
  if (!previous && !next) return null;

  return (
    <div className="grid grid-cols-1 gap-4 border-t border-border-subtle pt-10 sm:grid-cols-2">
      {previous ? <ArticleNavCard news={previous} direction="previous" /> : <span />}
      {next ? <ArticleNavCard news={next} direction="next" /> : <span />}
    </div>
  );
}

function ArticleNavCard({ news, direction }: { news: News; direction: "previous" | "next" }) {
  const isNext = direction === "next";
  return (
    <Link
      href={`/noticia/${news.slug}`}
      className={`group flex items-center gap-4 rounded-2xl border border-border-subtle p-4 transition-all hover:border-brand-500/40 hover:shadow-md ${isNext ? "sm:flex-row-reverse sm:text-right" : ""}`}
    >
      <span className="relative size-16 shrink-0 overflow-hidden rounded-xl">
        <Image src={news.coverImage} alt={news.coverImageAlt} fill sizes="64px" className="object-cover" />
      </span>
      <div className="min-w-0">
        <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-foreground/40">
          {!isNext ? <HiOutlineArrowLeft className="size-3.5" /> : null}
          {isNext ? "Próxima notícia" : "Notícia anterior"}
          {isNext ? <HiOutlineArrowRight className="size-3.5" /> : null}
        </span>
        <p className="mt-1 line-clamp-2 font-heading text-sm font-medium text-foreground transition-colors group-hover:text-brand-600 dark:group-hover:text-brand-400">
          {news.title}
        </p>
      </div>
    </Link>
  );
}
