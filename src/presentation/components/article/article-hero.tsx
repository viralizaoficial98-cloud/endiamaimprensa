import Image from "next/image";
import type { News } from "@/domain/entities";
import { formatDate } from "@/lib/format";
import { AnimatedTitle } from "@/presentation/components/ui/animated-title";
import { CategoryBadge } from "@/presentation/components/ui/category-badge";
import { ReadTime, ViewCount } from "@/presentation/components/ui/meta";

export function ArticleHero({ news }: { news: News }) {
  return (
    <section className="relative flex min-h-[70vh] items-end overflow-hidden bg-brand-950 pb-14 pt-32 sm:min-h-[80vh]">
      <Image src={news.coverImage} alt={news.coverImageAlt} fill priority fetchPriority="high" sizes="100vw" className="object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/10" />

      <div className="relative z-10 mx-auto w-full max-w-4xl px-5 sm:px-8">
        <CategoryBadge name={news.category.name} slug={news.category.slug} size="md" />
        <AnimatedTitle
          text={news.title}
          className="mt-5 font-heading text-3xl font-medium leading-[1.08] text-white sm:text-5xl"
        />
        {news.subtitle ? <p className="mt-4 max-w-2xl text-lg text-white/75">{news.subtitle}</p> : null}

        <div className="mt-8 flex flex-wrap items-center gap-5 text-sm text-white/70">
          <span>{formatDate(news.publishedAt)}</span>
          <ReadTime minutes={news.readTimeMinutes} />
          <ViewCount views={news.views} />
        </div>
      </div>
    </section>
  );
}
