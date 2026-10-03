import type { News } from "@/domain/entities";
import { NewsCard } from "@/presentation/components/ui/news-card";
import { RevealGroup } from "@/presentation/components/ui/reveal";

export function RelatedNews({ news }: { news: News[] }) {
  if (news.length === 0) return null;
  return (
    <section>
      <h2 className="font-heading text-xl font-medium text-foreground">Notícias Relacionadas</h2>
      <RevealGroup className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4" stagger={0.1}>
        {news.map((item) => (
          <NewsCard key={item.id} news={item} />
        ))}
      </RevealGroup>
    </section>
  );
}
