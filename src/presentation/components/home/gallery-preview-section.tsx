import { getGalleryAlbumsPreview } from "@/application/use-cases/gallery-use-cases";
import { Container } from "@/presentation/components/ui/container";
import { SectionHeader } from "@/presentation/components/ui/section-header";
import { RetryPanel } from "@/presentation/components/ui/retry-panel";
import { RevealGroup, RevealItem } from "@/presentation/components/ui/reveal";
import { fadeUp } from "@/presentation/animations/variants";
import { GalleryAlbumCard } from "@/presentation/components/gallery/gallery-album-card";

export async function GalleryPreviewSection() {
  let albums;
  try {
    albums = await getGalleryAlbumsPreview(9);
  } catch {
    return (
      <section className="py-20 sm:py-28">
        <Container>
          <SectionHeader eyebrow="Visual" title="Galeria Premium" href="/galeria" />
          <RetryPanel message="Não foi possível carregar a galeria neste momento." />
        </Container>
      </section>
    );
  }

  return (
    <section className="py-20 sm:py-28">
      <Container>
        <SectionHeader eyebrow="Visual" title="Galeria Premium" href="/galeria" />
        {albums.length === 0 ? (
          <p className="py-16 text-center text-sm text-foreground/50">Ainda não existem galerias publicadas.</p>
        ) : (
          <RevealGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" stagger={0.05}>
            {albums.map((album, i) => (
              <RevealItem key={album.id} variants={fadeUp}>
                <GalleryAlbumCard album={album} priority={i < 3} />
              </RevealItem>
            ))}
          </RevealGroup>
        )}
      </Container>
    </section>
  );
}
