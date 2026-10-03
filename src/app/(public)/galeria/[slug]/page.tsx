import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HiOutlineCalendar, HiOutlinePhoto } from "react-icons/hi2";
import { getGalleryAlbumBySlug } from "@/application/use-cases/gallery-use-cases";
import { GalleryDetailGrid } from "@/presentation/components/gallery/gallery-detail-grid";
import { Container } from "@/presentation/components/ui/container";
import { Reveal } from "@/presentation/components/ui/reveal";
import { CategoryBadge } from "@/presentation/components/ui/category-badge";
import { formatDate } from "@/lib/format";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const album = await getGalleryAlbumBySlug(slug);
  if (!album) return { title: "Galeria" };
  return {
    title: album.title,
    description: album.description ?? `${album.photoCount} fotografias — ${album.category.name}, ENDIAMA E.P.`,
    openGraph: { images: [{ url: album.coverImage }] },
  };
}

export default async function GalleryAlbumPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const album = await getGalleryAlbumBySlug(slug);
  if (!album) notFound();

  return (
    <div className="pb-24 pt-36 sm:pt-40">
      <Container>
        <Reveal className="max-w-3xl">
          <CategoryBadge name={album.category.name} slug={album.category.slug} size="md" />
          <h1 className="mt-4 font-heading text-3xl font-medium tracking-tight text-foreground sm:text-4xl">{album.title}</h1>
          {album.description ? <p className="mt-3 text-base text-foreground/60">{album.description}</p> : null}
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-foreground/50">
            <span className="inline-flex items-center gap-1.5">
              <HiOutlineCalendar className="size-4" />
              {formatDate(album.eventDate)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <HiOutlinePhoto className="size-4" />
              {album.photoCount} {album.photoCount === 1 ? "fotografia" : "fotografias"}
            </span>
          </div>
        </Reveal>

        <div className="mt-10">
          <GalleryDetailGrid photos={album.photos} albumTitle={album.title} />
        </div>
      </Container>
    </div>
  );
}
