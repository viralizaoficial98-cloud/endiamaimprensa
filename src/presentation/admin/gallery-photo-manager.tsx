"use client";

import { useRef, useState } from "react";
import { HiOutlineBars3, HiOutlineStar, HiOutlineTrash } from "react-icons/hi2";
import { adminDelete, adminGet, adminPatch, adminPost, adminUploadFile } from "@/infrastructure/api/admin-http-client";
import { revalidateContentCache } from "@/infrastructure/api/revalidate-client";
import { describeError } from "./news-form";

export interface AdminGalleryPhoto {
  id: string;
  imageUrl: string;
  thumbnailUrl: string | null;
  caption: string | null;
  altText: string;
  order: number;
}

interface AdminGalleryDetail {
  coverImage: string;
  images: AdminGalleryPhoto[];
}

/** Bulk multi-file upload (10, 50, 100+ photos in one go), drag-and-drop
 * reordering, inline caption/alt editing, "Definir como capa", and removal —
 * everything the album's "Fotografias" management needs. Rendered only once
 * the parent Gallery record exists (photos are a child relation). */
export function GalleryPhotoManager({
  galleryId,
  galleryTitle,
  initialPhotos,
  initialCoverImage,
}: {
  galleryId: string;
  galleryTitle: string;
  initialPhotos: AdminGalleryPhoto[];
  initialCoverImage: string;
}) {
  const [photos, setPhotos] = useState<AdminGalleryPhoto[]>([...initialPhotos].sort((a, b) => a.order - b.order));
  const [coverImage, setCoverImage] = useState(initialCoverImage);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const dragIndex = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  async function reload() {
    const gallery = await adminGet<AdminGalleryDetail>(`/admin/galleries/${galleryId}`);
    setPhotos([...gallery.images].sort((a, b) => a.order - b.order));
    setCoverImage(gallery.coverImage);
  }

  async function handleFilesSelected(files: FileList) {
    setError(null);
    setUploading(true);
    setUploadProgress({ done: 0, total: files.length });
    try {
      const uploaded: { imageUrl: string; thumbnailUrl?: string; altText: string }[] = [];
      let i = 0;
      for (const file of Array.from(files)) {
        i += 1;
        const altText = `${galleryTitle} — fotografia ${photos.length + i}`;
        const result = await adminUploadFile("galleries", file, altText);
        uploaded.push({ imageUrl: result.url, thumbnailUrl: result.thumbnailUrl, altText });
        setUploadProgress({ done: i, total: files.length });
      }
      await adminPost(`/admin/galleries/${galleryId}/images/bulk`, { images: uploaded });
      await revalidateContentCache(["galleries"]);
      await reload();
    } catch (err) {
      setError(describeError(err, "Não foi possível carregar uma ou mais fotografias."));
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  }

  async function handleSetCover(photo: AdminGalleryPhoto) {
    setError(null);
    try {
      await adminPatch(`/admin/galleries/${galleryId}`, { coverImage: photo.imageUrl });
      setCoverImage(photo.imageUrl);
      await revalidateContentCache(["galleries"]);
    } catch (err) {
      setError(describeError(err, "Não foi possível definir a capa."));
    }
  }

  async function handleCaptionBlur(photo: AdminGalleryPhoto, field: "caption" | "altText", value: string) {
    if ((photo[field] ?? "") === value) return;
    try {
      await adminPatch(`/admin/galleries/images/${photo.id}`, { [field]: value });
      setPhotos((prev) => prev.map((p) => (p.id === photo.id ? { ...p, [field]: value } : p)));
      await revalidateContentCache(["galleries"]);
    } catch (err) {
      setError(describeError(err, "Não foi possível guardar a alteração."));
    }
  }

  async function handleRemove(photo: AdminGalleryPhoto) {
    if (!window.confirm("Tem certeza que deseja remover esta fotografia da galeria?")) return;
    setError(null);
    try {
      await adminDelete(`/admin/galleries/images/${photo.id}`);
      await revalidateContentCache(["galleries"]);
      await reload();
    } catch (err) {
      setError(describeError(err, "Não foi possível remover a fotografia."));
    }
  }

  function handleDragStart(index: number) {
    dragIndex.current = index;
  }
  function handleDragOver(index: number, e: React.DragEvent) {
    e.preventDefault();
    setDragOverIndex(index);
  }
  async function handleDrop(index: number) {
    const from = dragIndex.current;
    dragIndex.current = null;
    setDragOverIndex(null);
    if (from === null || from === index) return;

    const reordered = [...photos];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(index, 0, moved);
    setPhotos(reordered);

    try {
      await adminPost(`/admin/galleries/${galleryId}/images/reorder`, {
        order: reordered.map((p, i) => ({ id: p.id, order: i })),
      });
      await revalidateContentCache(["galleries"]);
    } catch (err) {
      setError(describeError(err, "Não foi possível reordenar as fotografias."));
      reload();
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-medium text-foreground">Fotografias ({photos.length})</h2>
        <label className="cursor-pointer rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
          + Adicionar Fotografias
          <input
            type="file"
            multiple
            accept="image/jpeg,image/jpg,image/png,image/webp"
            className="hidden"
            onChange={(e) => e.target.files && e.target.files.length > 0 && handleFilesSelected(e.target.files)}
          />
        </label>
      </div>

      {uploading ? (
        <p className="mt-3 text-sm text-foreground/60">
          A carregar fotografia {uploadProgress?.done ?? 0} de {uploadProgress?.total ?? 0}...
        </p>
      ) : null}
      {error ? <p className="mt-3 text-sm text-red-500">{error}</p> : null}

      {photos.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-border-subtle py-10 text-center text-sm text-foreground/40">
          Ainda não foram adicionadas fotografias. Utilize &quot;+ Adicionar Fotografias&quot; para carregar várias de uma vez.
        </p>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo, index) => {
            const isCover = photo.imageUrl === coverImage;
            return (
              <div
                key={photo.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(index, e)}
                onDrop={() => handleDrop(index)}
                className={`overflow-hidden rounded-xl border bg-surface ${dragOverIndex === index ? "border-brand-500 ring-2 ring-brand-500/30" : "border-border-subtle"}`}
              >
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.thumbnailUrl ?? photo.imageUrl} alt={photo.altText} className="h-32 w-full object-cover" />
                  <span className="absolute left-1.5 top-1.5 cursor-grab rounded-full bg-black/50 p-1 text-white" title="Arrastar para reordenar">
                    <HiOutlineBars3 className="size-3.5" />
                  </span>
                  {isCover ? (
                    <span className="absolute right-1.5 top-1.5 rounded-full bg-gold-500 px-2 py-0.5 text-[10px] font-semibold text-brand-950">Capa</span>
                  ) : null}
                </div>
                <div className="space-y-1.5 p-2">
                  <input
                    defaultValue={photo.caption ?? ""}
                    placeholder="Legenda (opcional)"
                    onBlur={(e) => handleCaptionBlur(photo, "caption", e.target.value)}
                    className="w-full rounded-md border border-border-subtle bg-background px-2 py-1 text-xs outline-none focus:border-brand-500"
                  />
                  <input
                    defaultValue={photo.altText}
                    placeholder="Texto alternativo"
                    onBlur={(e) => handleCaptionBlur(photo, "altText", e.target.value)}
                    className="w-full rounded-md border border-border-subtle bg-background px-2 py-1 text-xs outline-none focus:border-brand-500"
                  />
                  <div className="flex items-center justify-between pt-0.5">
                    <button
                      type="button"
                      disabled={isCover}
                      onClick={() => handleSetCover(photo)}
                      title="Definir como capa"
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-foreground/60 hover:text-brand-600 disabled:opacity-40"
                    >
                      <HiOutlineStar className="size-3.5" />
                      Capa
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(photo)}
                      title="Remover fotografia"
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-red-500 hover:underline"
                    >
                      <HiOutlineTrash className="size-3.5" />
                      Remover
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
