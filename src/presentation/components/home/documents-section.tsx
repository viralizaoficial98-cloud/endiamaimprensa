import type { EndiamaDocument } from "@/domain/entities";
import { Container } from "@/presentation/components/ui/container";
import { DocumentCard } from "@/presentation/components/ui/document-card";
import { RevealGroup } from "@/presentation/components/ui/reveal";
import { SectionHeader } from "@/presentation/components/ui/section-header";

export function DocumentsSection({ documents }: { documents: EndiamaDocument[] }) {
  return (
    <section id="documentos" className="bg-surface-muted py-20 sm:py-28">
      <Container>
        <SectionHeader eyebrow="Recursos" title="Documentos" description="Relatórios, planos estratégicos e dados oficiais da ENDIAMA." />
        <RevealGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2" stagger={0.08}>
          {documents.map((document) => (
            <DocumentCard key={document.id} document={document} />
          ))}
        </RevealGroup>
      </Container>
    </section>
  );
}
