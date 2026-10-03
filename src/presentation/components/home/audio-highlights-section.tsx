import type { EndiamaAudio } from "@/domain/entities";
import { AudioHubCarousel } from "@/presentation/components/audio/audio-hub-carousel";
import { FeaturedAudioCard } from "@/presentation/components/audio/featured-audio-card";
import { LatestAudiosList } from "@/presentation/components/audio/latest-audios-list";
import { Container } from "@/presentation/components/ui/container";
import { Reveal } from "@/presentation/components/ui/reveal";
import { SectionHeader } from "@/presentation/components/ui/section-header";

/**
 * "Central de Áudio ENDIAMA" — deliberately not another photo-first card
 * grid. Editorial content (title/category/duration/play) leads, covers stay
 * small, and the panel gets its own institutional-toned surface so this
 * section reads as a player, not a gallery, at a glance.
 */
export function AudioHighlightsSection({ audios }: { audios: EndiamaAudio[] }) {
  if (audios.length === 0) return null;

  const featured = audios.find((a) => a.isFeatured) ?? audios[0];
  const rest = audios.filter((a) => a.id !== featured.id);
  const latest = audios.slice(0, 5);

  return (
    <section className="py-20 sm:py-28">
      <Container>
        <SectionHeader eyebrow="Áudios" title="Ouça os Destaques" href="/audios" hrefLabel="Ver todos os áudios" />

        <Reveal>
          <div className="rounded-3xl border border-border-subtle bg-surface-muted p-5 dark:bg-brand-950 sm:p-8">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)] lg:gap-10">
              <FeaturedAudioCard audio={featured} />
              {rest.length > 0 ? (
                <div className="lg:border-l lg:border-border-subtle/60 lg:pl-8 dark:lg:border-white/10">
                  <AudioHubCarousel audios={rest} />
                </div>
              ) : null}
            </div>
          </div>
        </Reveal>

        {latest.length > 1 ? (
          <div className="mt-10">
            <h3 className="mb-4 font-heading text-base font-medium text-foreground/70">Últimos Áudios</h3>
            <LatestAudiosList audios={latest} />
          </div>
        ) : null}
      </Container>
    </section>
  );
}
