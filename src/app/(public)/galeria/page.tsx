import type { Metadata } from "next";
import { getGalleryCategories, listGalleryAlbums } from "@/application/use-cases/gallery-use-cases";
import { GalleryAlbumExplorer } from "@/presentation/components/gallery/gallery-album-explorer";
import { Container } from "@/presentation/components/ui/container";
import { Reveal } from "@/presentation/components/ui/reveal";

export const metadata: Metadata = {
  title: "Galeria",
  description: "Galeria premium de fotografia da ENDIAMA E.P. — Conselho de Administração, Directores e Delegados e Indústria Diamantífera.",
};

const PAGE_SIZE = 12;

export default async function GaleriaPage() {
  const [{ data: albums, pagination }, categories] = await Promise.all([
    listGalleryAlbums({ limit: PAGE_SIZE }),
    getGalleryCategories(),
  ]);

  return (
    <div className="pb-24 pt-36 sm:pt-40">
      <Container>
        <Reveal className="max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400">
            Visual
          </span>
          <h1 className="mt-3 font-heading text-4xl font-medium tracking-tight text-foreground sm:text-5xl">
            Galeria Premium
          </h1>
          <p className="mt-4 text-base text-foreground/60 sm:text-lg">
            Uma selecção visual das operações mineiras, eventos institucionais e comunidades da ENDIAMA E.P.
          </p>
        </Reveal>

        <div className="mt-12">
          <GalleryAlbumExplorer initialAlbums={albums} initialPagination={pagination} categories={categories} />
        </div>
      </Container>
    </div>
  );
}
