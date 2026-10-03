import type { News } from "@/domain/entities";
import { Container } from "@/presentation/components/ui/container";
import { NewsCard } from "@/presentation/components/ui/news-card";
import { RevealGroup, RevealItem } from "@/presentation/components/ui/reveal";
import { SectionHeader } from "@/presentation/components/ui/section-header";
import { fadeLeft } from "@/presentation/animations/variants";

export function MostReadSection({ news }: { news: News[] }) {
  return (
    <section className="py-20 sm:py-28">
      <Container>
        <SectionHeader eyebrow="Popular" title="Mais Lidas" />
        <RevealGroup className="grid grid-cols-1 divide-y divide-border-subtle sm:grid-cols-2 sm:gap-x-10 sm:divide-y-0 lg:grid-cols-4">
          {news.map((item, i) => (
            <RevealItem key={item.id} variants={fadeLeft} className="relative py-5 first:pt-0 sm:py-0">
              <span className="font-heading absolute -left-1 -top-2 text-5xl font-semibold text-border-subtle sm:static sm:mb-3 sm:block sm:text-4xl">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="pl-14 sm:pl-0">
                <NewsCard news={item} variant="compact" />
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>
    </section>
  );
}
