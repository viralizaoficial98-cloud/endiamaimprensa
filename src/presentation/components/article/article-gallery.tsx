"use client";

import Image from "next/image";
import { useState } from "react";
import { Lightbox } from "@/presentation/components/gallery/lightbox";

export function ArticleGallery({ images, title }: { images: string[]; title: string }) {
  const [index, setIndex] = useState<number | null>(null);
  if (images.length === 0) return null;

  const lightboxImages = images.map((src) => ({ src, caption: title }));

  return (
    <section>
      <h2 className="font-heading text-xl font-medium text-foreground">Galeria</h2>
      <div className="mt-5 grid grid-cols-3 gap-3">
        {images.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => setIndex(i)}
            className="group relative aspect-square overflow-hidden rounded-xl"
          >
            <Image
              src={src}
              alt={`${title} — imagem ${i + 1}`}
              fill
              sizes="(max-width: 768px) 33vw, 200px"
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
          </button>
        ))}
      </div>
      <Lightbox images={lightboxImages} index={index} onClose={() => setIndex(null)} onIndexChange={setIndex} />
    </section>
  );
}
