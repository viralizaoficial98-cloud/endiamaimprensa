"use client";

import Image from "next/image";
import { useState } from "react";
import type { NewsBlockGalleryImage } from "@/domain/entities";
import { Lightbox } from "@/presentation/components/gallery/lightbox";

/** A small inline photo gallery a block can carry anywhere in the article body
 * — independent from the cover image and from the (separate, article-level)
 * ArticleGallery component. Desktop: grid. Mobile: same grid, 2 columns, so it
 * never forces horizontal scroll. Click opens the shared Lightbox. */
export function GalleryBlock({ images, articleTitle }: { images: NewsBlockGalleryImage[]; articleTitle: string }) {
  const [index, setIndex] = useState<number | null>(null);
  if (images.length === 0) return null;

  const lightboxImages = images.map((img) => ({ src: img.url, caption: img.caption }));

  return (
    <figure>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {images.map((img, i) => (
          <button
            key={img.url + i}
            type="button"
            onClick={() => setIndex(i)}
            className="group relative aspect-square overflow-hidden rounded-xl"
          >
            <Image
              src={img.url}
              alt={img.alt || `${articleTitle} — fotografia ${i + 1}`}
              fill
              sizes="(max-width: 768px) 50vw, 300px"
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
          </button>
        ))}
      </div>
      <Lightbox images={lightboxImages} index={index} onClose={() => setIndex(null)} onIndexChange={setIndex} />
    </figure>
  );
}
