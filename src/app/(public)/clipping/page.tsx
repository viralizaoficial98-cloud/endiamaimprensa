import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { getAllCategories } from "@/application/use-cases/category-use-cases";
import { listClippings } from "@/application/use-cases/clipping-use-cases";
import { ClippingExplorer } from "@/presentation/components/clipping/clipping-explorer";
import { Container } from "@/presentation/components/ui/container";
import { Reveal } from "@/presentation/components/ui/reveal";

export const metadata: Metadata = {
  title: "Clipping",
  description: "Monitorização de media da ENDIAMA E.P. — imprensa escrita, televisão, rádio e portais digitais.",
};

export default async function ClippingPage() {
  const locale = await getLocale();
  const [{ data: items }, categories] = await Promise.all([
    listClippings({ limit: 100 }).catch(() => ({ data: [], pagination: { page: 1, limit: 100, total: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false } })),
    getAllCategories(locale).catch(() => []),
  ]);

  return (
    <div className="pb-24 pt-36 sm:pt-40">
      <Container>
        <Reveal className="max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400">Media</span>
          <h1 className="mt-3 font-heading text-4xl font-medium tracking-tight text-foreground sm:text-5xl">Clipping</h1>
          <p className="mt-4 text-base text-foreground/60 sm:text-lg">
            Monitorização da presença da ENDIAMA E.P. na imprensa escrita, televisão, rádio e portais digitais.
          </p>
        </Reveal>

        <div className="mt-12">
          {items.length === 0 ? (
            <p className="py-16 text-center text-sm text-foreground/50">Ainda não existem registos de clipping publicados.</p>
          ) : (
            <ClippingExplorer items={items} categories={categories} />
          )}
        </div>
      </Container>
    </div>
  );
}
