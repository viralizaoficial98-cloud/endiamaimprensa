"use client";

import { useState } from "react";
import { HiOutlineArrowDown, HiOutlineArrowUp, HiOutlineTrash } from "react-icons/hi2";
import { adminUploadFile } from "@/infrastructure/api/admin-http-client";
import { describeError } from "@/presentation/admin/news-form-helpers";
import type { NewsBlockImageInput, NewsBlockInput } from "./types";

/** Multi-file upload → N sequential calls to the existing single-file upload
 * endpoint (no new backend upload route needed), same pattern already used by
 * GalleryPhotoManager for the standalone Galerias module. */
export function GalleryBlockEditor({ block, onChange }: { block: NewsBlockInput; onChange: (block: NewsBlockInput) => void }) {
  const images = block.images ?? [];
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList) {
    setError(null);
    setUploading(true);
    setProgress({ done: 0, total: files.length });
    try {
      const uploaded: NewsBlockImageInput[] = [];
      let i = 0;
      for (const file of Array.from(files)) {
        i += 1;
        const result = await adminUploadFile("news", file, `Fotografia ${images.length + i}`);
        uploaded.push({ url: result.url, thumbnailUrl: result.thumbnailUrl, alt: `Fotografia ${images.length + i}` });
        setProgress({ done: i, total: files.length });
      }
      onChange({ ...block, images: [...images, ...uploaded] });
    } catch (err) {
      setError(describeError(err, "Não foi possível carregar uma ou mais fotografias."));
    } finally {
      setUploading(false);
      setProgress(null);
    }
  }

  function updateImage(index: number, patch: Partial<NewsBlockImageInput>) {
    onChange({ ...block, images: images.map((img, i) => (i === index ? { ...img, ...patch } : img)) });
  }

  function removeImage(index: number) {
    if (!window.confirm("Remover esta fotografia da galeria?")) return;
    onChange({ ...block, images: images.filter((_, i) => i !== index) });
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    onChange({ ...block, images: next });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-foreground/70">Galeria de Imagens ({images.length})</p>
        <label className="cursor-pointer rounded-md bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700">
          + Adicionar fotografias
          <input
            type="file"
            multiple
            accept="image/jpeg,image/jpg,image/png,image/webp"
            className="hidden"
            onChange={(e) => e.target.files && e.target.files.length > 0 && handleFiles(e.target.files)}
          />
        </label>
      </div>
      {uploading ? (
        <p className="text-xs text-foreground/50">
          A carregar fotografia {progress?.done ?? 0} de {progress?.total ?? 0}...
        </p>
      ) : null}
      {error ? <p className="text-xs text-red-500">{error}</p> : null}

      {images.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border-subtle py-6 text-center text-xs text-foreground/40">
          Ainda sem fotografias — use &quot;+ Adicionar fotografias&quot; para carregar uma ou várias.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((img, index) => (
            <div key={img.url + index} className="overflow-hidden rounded-lg border border-border-subtle bg-background">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.thumbnailUrl ?? img.url} alt={img.alt ?? ""} className="h-24 w-full object-cover" />
              <div className="space-y-1 p-2">
                <input
                  placeholder="Texto alternativo"
                  defaultValue={img.alt ?? ""}
                  onBlur={(e) => updateImage(index, { alt: e.target.value })}
                  className="w-full rounded border border-border-subtle bg-surface px-1.5 py-1 text-[11px] outline-none focus:border-brand-500"
                />
                <input
                  placeholder="Legenda (opcional)"
                  defaultValue={img.caption ?? ""}
                  onBlur={(e) => updateImage(index, { caption: e.target.value })}
                  className="w-full rounded border border-border-subtle bg-surface px-1.5 py-1 text-[11px] outline-none focus:border-brand-500"
                />
                <div className="flex items-center justify-between pt-0.5">
                  <div className="flex items-center gap-0.5">
                    <button type="button" disabled={index === 0} onClick={() => move(index, -1)} className="rounded p-0.5 text-foreground/50 hover:bg-surface-muted disabled:opacity-30">
                      <HiOutlineArrowUp className="size-3" />
                    </button>
                    <button type="button" disabled={index === images.length - 1} onClick={() => move(index, 1)} className="rounded p-0.5 text-foreground/50 hover:bg-surface-muted disabled:opacity-30">
                      <HiOutlineArrowDown className="size-3" />
                    </button>
                  </div>
                  <button type="button" onClick={() => removeImage(index)} className="text-red-500 hover:text-red-600">
                    <HiOutlineTrash className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
