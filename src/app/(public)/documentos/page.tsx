import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { getAllCategories } from "@/application/use-cases/category-use-cases";
import { listDocuments } from "@/application/use-cases/document-use-cases";
import { DocumentsExplorer } from "@/presentation/components/documents/documents-explorer";
import { Container } from "@/presentation/components/ui/container";
import { Reveal } from "@/presentation/components/ui/reveal";

export const metadata: Metadata = {
  title: "Documentos",
  description: "Biblioteca documental institucional da ENDIAMA E.P. — relatórios, planos estratégicos e dados oficiais.",
};

export default async function DocumentosPage() {
  const locale = await getLocale();
  const [{ data: documents }, categories] = await Promise.all([
    listDocuments({ limit: 100 }).catch(() => ({ data: [], pagination: { page: 1, limit: 100, total: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false } })),
    getAllCategories(locale).catch(() => []),
  ]);

  return (
    <div className="pb-24 pt-36 sm:pt-40">
      <Container>
        <Reveal className="max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400">Recursos</span>
          <h1 className="mt-3 font-heading text-4xl font-medium tracking-tight text-foreground sm:text-5xl">Documentos</h1>
          <p className="mt-4 text-base text-foreground/60 sm:text-lg">
            Relatórios, planos estratégicos e dados oficiais da ENDIAMA E.P., disponíveis para consulta e download.
          </p>
        </Reveal>

        <div className="mt-12">
          {documents.length === 0 ? (
            <p className="py-16 text-center text-sm text-foreground/50">Ainda não existem documentos publicados.</p>
          ) : (
            <DocumentsExplorer documents={documents} categories={categories} />
          )}
        </div>
      </Container>
    </div>
  );
}
