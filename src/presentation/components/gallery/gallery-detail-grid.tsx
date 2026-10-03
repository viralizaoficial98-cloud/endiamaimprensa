"use client";

import Image from "next/image";
import { useState } from "react";
import { HiOutlineMagnifyingGlassPlus } from "react-icons/hi2";
import type { GalleryPhoto } from "@/domain/entities";
import { RevealGroup } from "@/presentation/components/ui/reveal";
import { scaleIn } from "@/presentation/animations/variants";
import { motion } from "framer-motion";
import { Lightbox } from "./lightbox";

/** Masonry-style grid of every photo in one album, with lazy-loaded thumbnails
 * (only the first row is eager/priority) so an album with hundreds of photos
 * never blocks on loading full-resolution images up front. */
export function GalleryDetailGrid({ photos, albumTitle }: { photos: GalleryPhoto[]; albumTitle: string }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (photos.length === 0) {
    return <p className="py-16 text-center text-sm text-foreground/50">Esta galeria ainda não tem fotografias.</p>;
  }

  const lightboxImages = photos.map((p) => ({ src: p.imageUrl, caption: p.caption ?? albumTitle }));

  return (
    <>
      <RevealGroup className="columns-2 gap-4 sm:columns-3 lg:columns-4" stagger={0.03}>
        {photos.map((photo, index) => (
          <motion.button
            key={photo.id}
            type="button"
            variants={scaleIn}
            onClick={() => setLightboxIndex(index)}
            className="group relative mb-4 block w-full break-inside-avoid overflow-hidden rounded-xl bg-surface-muted"
          >
            <Image
              src={photo.thumbnailUrl ?? photo.imageUrl}
              alt={photo.altText}
              width={600}
              height={450}
              loading={index < 8 ? "eager" : "lazy"}
              className="w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/20" />
            <span className="absolute right-2.5 top-2.5 flex size-8 items-center justify-center rounded-full bg-black/40 text-white opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">
              <HiOutlineMagnifyingGlassPlus className="size-4" />
            </span>
          </motion.button>
        ))}
      </RevealGroup>

      <Lightbox images={lightboxImages} index={lightboxIndex} onClose={() => setLightboxIndex(null)} onIndexChange={setLightboxIndex} />
    </>
  );
}
