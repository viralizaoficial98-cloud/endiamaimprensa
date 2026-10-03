import type { Partner } from "@/domain/entities";
import { Container } from "@/presentation/components/ui/container";
import { RevealGroup, RevealItem } from "@/presentation/components/ui/reveal";
import { SectionHeader } from "@/presentation/components/ui/section-header";
import { PartnerCard } from "./partner-card";

/** Above this count a static grid gets crowded — switch to a slow, pausable
 * marquee instead of shrinking every logo down to stay legible. */
const MARQUEE_THRESHOLD = 8;

export function PartnersSection({ partners }: { partners: Partner[] }) {
  if (partners.length === 0) return null;

  const sorted = [...partners].sort((a, b) => a.order - b.order);
  const useMarquee = sorted.length > MARQUEE_THRESHOLD;

  return (
    <section className="py-20 sm:py-24">
      <Container>
        <SectionHeader eyebrow="Rede" title="Parceiros" description="Instituições e empresas que colaboram com a ENDIAMA E.P." />
      </Container>

      {useMarquee ? (
        <div className="group relative overflow-hidden py-2">
          <div className="animate-marquee flex w-max items-stretch gap-5 group-hover:[animation-play-state:paused]">
            {[...sorted, ...sorted].map((partner, i) => (
              <div key={`${partner.id}-${i}`} className="w-48 shrink-0">
                <PartnerCard partner={partner} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <Container>
          <RevealGroup className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
            {sorted.map((partner) => (
              <RevealItem key={partner.id}>
                <PartnerCard partner={partner} />
              </RevealItem>
            ))}
          </RevealGroup>
        </Container>
      )}
    </section>
  );
}
