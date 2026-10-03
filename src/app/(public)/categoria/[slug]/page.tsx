import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getNewsByCategory } from "@/application/use-cases/news-use-cases";
import { getAllCategories, getCategoryBySlug } from "@/application/use-cases/category-use-cases";
import { getCategoryHeroPhoto } from "@/presentation/lib/category-hero-photo";
import { NewsCard } from "@/presentation/components/ui/news-card";
import { Container } from "@/presentation/components/ui/container";
import { RevealGroup, Reveal } from "@/presentation/components/ui/reveal";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const categories = await getAllCategories();
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const category = await getCategoryBySlug(slug, locale);
  if (!category) return {};
  return {
    title: category.name,
    description: category.description ?? `Notícias da categoria ${category.name} na ENDIAMA E.P.`,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const locale = await getLocale();
  const category = await getCategoryBySlug(slug, locale);
  if (!category) notFound();

  const news = await getNewsByCategory(slug, 24, locale);
  const photo = getCategoryHeroPhoto(slug);

  return (
    <div className="pb-24">
      <section className="relative flex h-[46vh] min-h-[320px] items-end overflow-hidden bg-brand-950 pb-10 pt-32">
        <Image src={photo} alt={category.name} fill priority fetchPriority="high" sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />
        <Container className="relative z-10">
          <Reveal className="max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-400">Categoria</span>
            <h1 className="mt-3 font-heading text-4xl font-medium tracking-tight text-white sm:text-5xl">
              {category.name}
            </h1>
            {category.description ? <p className="mt-4 text-base text-white/75 sm:text-lg">{category.description}</p> : null}
          </Reveal>
        </Container>
      </section>

      <Container>
        <RevealGroup className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" stagger={0.08}>
          {news.length > 0 ? (
            news.map((item, i) => <NewsCard key={item.id} news={item} priority={i < 2} />)
          ) : (
            <p className="text-sm text-foreground/50">Ainda não existem notícias publicadas nesta categoria.</p>
          )}
        </RevealGroup>
      </Container>
    </div>
  );
}
