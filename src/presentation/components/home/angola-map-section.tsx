"use client";

import Image from "next/image";
import { useState } from "react";
import { HiArrowsPointingOut } from "react-icons/hi2";
import { Lightbox } from "@/presentation/components/gallery/lightbox";
import { Container } from "@/presentation/components/ui/container";
import { Reveal } from "@/presentation/components/ui/reveal";
import { SectionHeader } from "@/presentation/components/ui/section-header";

/** Institutional map supplied as a finished graphic (public/images/minas.png)
 * — mapa + lista de províncias + minerais já vêm desenhados na imagem, por
 * isso esta secção só a apresenta; não recria nada disso em SVG/HTML. */
const MAP_SRC = "/images/minas.png";
const MAP_ALT = "Mapa de Angola com as províncias com actividade mineira: petróleo e gás, diamantes, ouro, cobre e outros minerais.";

export function AngolaMapSection() {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  return (
    <section className="bg-surface-muted py-20 sm:py-28">
      <Container>
        <SectionHeader
          eyebrow="Cobertura Nacional"
          title="Presença Nacional"
          description="Operações e projectos da ENDIAMA nas principais províncias mineiras de Angola."
        />

        <Reveal variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } } }}>
          <div className="group relative overflow-hidden rounded-[20px] border border-border-subtle bg-white shadow-sm dark:bg-surface">
            <div className="overflow-x-auto">
              <Image
                src={MAP_SRC}
                alt={MAP_ALT}
                width={1808}
                height={870}
                sizes="(max-width: 1400px) 100vw, 1400px"
                className="h-auto w-full min-w-[640px] object-contain transition-transform duration-300 ease-out group-hover:scale-[1.008]"
              />
            </div>

            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              aria-label="Ampliar mapa"
              className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full bg-white/90 px-3.5 py-2 text-xs font-medium text-brand-900 shadow-md backdrop-blur-sm transition-colors hover:bg-white"
            >
              <HiArrowsPointingOut className="size-3.5" />
              <span className="hidden sm:inline">Ampliar mapa</span>
            </button>
          </div>
        </Reveal>
      </Container>

      <Lightbox
        images={[{ src: MAP_SRC, caption: "Angola — Províncias com actividade mineira" }]}
        index={lightboxOpen ? 0 : null}
        onClose={() => setLightboxOpen(false)}
        onIndexChange={() => {}}
      />
    </section>
  );
}
