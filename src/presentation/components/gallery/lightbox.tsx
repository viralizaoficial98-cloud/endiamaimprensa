"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect } from "react";
import { HiChevronLeft, HiChevronRight, HiXMark } from "react-icons/hi2";

interface LightboxImage {
  src: string;
  caption?: string;
  credit?: string;
}

interface LightboxProps {
  images: LightboxImage[];
  index: number | null;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

export function Lightbox({ images, index, onClose, onIndexChange }: LightboxProps) {
  const open = index !== null;
  const current = open ? images[index] : null;

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onIndexChange(((index ?? 0) + 1) % images.length);
      if (e.key === "ArrowLeft") onIndexChange(((index ?? 0) - 1 + images.length) % images.length);
    }
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, index, images.length, onClose, onIndexChange]);

  return (
    <AnimatePresence>
      {open && current ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 sm:p-8"
          role="dialog"
          aria-modal
          onClick={onClose}
        >
          {images.length > 1 ? (
            <span className="absolute left-1/2 top-5 z-10 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur-sm">
              {(index ?? 0) + 1} / {images.length}
            </span>
          ) : null}

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="absolute right-5 top-5 inline-flex size-11 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:bg-white/10"
          >
            <HiXMark className="size-5" />
          </button>

          {images.length > 1 ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onIndexChange(((index ?? 0) - 1 + images.length) % images.length);
              }}
              aria-label="Imagem anterior"
              className="absolute left-3 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:bg-white/10 sm:left-6"
            >
              <HiChevronLeft className="size-6" />
            </button>
          ) : null}

          <motion.div
            key={current.src}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.3 }}
            drag={images.length > 1 ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.6}
            onDragEnd={(_, info) => {
              if (info.offset.x < -80) onIndexChange(((index ?? 0) + 1) % images.length);
              else if (info.offset.x > 80) onIndexChange(((index ?? 0) - 1 + images.length) % images.length);
            }}
            onClick={(e) => e.stopPropagation()}
            className="relative flex max-h-full max-w-5xl cursor-grab flex-col items-center active:cursor-grabbing"
          >
            <div className="relative max-h-[80vh] w-full overflow-hidden rounded-xl">
              <Image
                src={current.src}
                alt={current.caption ?? ""}
                width={1400}
                height={1000}
                draggable={false}
                className="max-h-[80vh] w-auto select-none rounded-xl object-contain"
              />
            </div>
            {current.caption ? <p className="mt-4 max-w-xl text-center text-sm text-white/70">{current.caption}</p> : null}
            {current.credit ? <p className="mt-1 text-center text-xs text-white/40">{current.credit}</p> : null}
          </motion.div>

          {images.length > 1 ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onIndexChange(((index ?? 0) + 1) % images.length);
              }}
              aria-label="Próxima imagem"
              className="absolute right-3 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:bg-white/10 sm:right-6"
            >
              <HiChevronRight className="size-6" />
            </button>
          ) : null}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
