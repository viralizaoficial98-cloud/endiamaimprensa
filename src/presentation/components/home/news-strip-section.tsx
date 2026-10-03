import type { News } from "@/domain/entities";
import { Container } from "@/presentation/components/ui/container";
import { NewsCard } from "@/presentation/components/ui/news-card";
import { RevealGroup } from "@/presentation/components/ui/reveal";
import { SectionHeader } from "@/presentation/components/ui/section-header";

interface NewsStripSectionProps {
  eyebrow: string;
  title: string;
  description?: string;
  news: News[];
  muted?: boolean;
}

export function NewsStripSection({ eyebrow, title, description, news, muted }: NewsStripSectionProps) {
  if (news.length === 0) return null;
  return (
    <section className={muted ? "bg-surface-muted py-20 sm:py-28" : "py-20 sm:py-28"}>
      <Container>
        <SectionHeader eyebrow={eyebrow} title={title} description={description} />
        <RevealGroup className="grid grid-cols-1 gap-5 lg:grid-cols-2" stagger={0.1}>
          {news.map((item) => (
            <NewsCard key={item.id} news={item} variant="horizontal" />
          ))}
        </RevealGroup>
      </Container>
    </section>
  );
}
