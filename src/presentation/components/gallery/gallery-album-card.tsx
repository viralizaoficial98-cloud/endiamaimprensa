import Image from "next/image";
import Link from "next/link";
import { HiOutlineCalendar, HiOutlinePhoto } from "react-icons/hi2";
import type { GalleryAlbumSummary } from "@/domain/entities";
import { formatDate } from "@/lib/format";

/** One card = one album (never a single photo) — cover image, category,
 * title, and an elegant photo-count + date footer. Reused by both the
 * homepage teaser and the full "Galeria Premium" listing so the two stay
 * visually identical. */
export function GalleryAlbumCard({ album, priority }: { album: GalleryAlbumSummary; priority?: boolean }) {
  return (
    <Link
      href={`/galeria/${album.slug}`}
      className="group relative block aspect-[4/3] overflow-hidden rounded-2xl shadow-sm transition-shadow duration-300 hover:shadow-xl"
    >
      <Image
        src={album.coverImage}
        alt={album.title}
        fill
        priority={priority}
        sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw"
        className="object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-95" />
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 p-4 sm:p-5">
        <span className="w-fit text-[10px] font-semibold uppercase tracking-wide text-gold-300">{album.category.name}</span>
        <p className="line-clamp-2 font-heading text-base font-medium leading-snug text-white sm:text-lg">{album.title}</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-white/70">
          <span className="inline-flex items-center gap-1">
            <HiOutlinePhoto className="size-3" />
            {album.photoCount} {album.photoCount === 1 ? "fotografia" : "fotografias"}
          </span>
          <span className="inline-flex items-center gap-1">
            <HiOutlineCalendar className="size-3" />
            {formatDate(album.eventDate)}
          </span>
        </div>
      </div>
    </Link>
  );
}
