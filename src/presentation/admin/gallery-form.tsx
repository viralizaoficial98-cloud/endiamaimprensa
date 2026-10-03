"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminGet, adminPatch, adminPost, adminUploadFile } from "@/infrastructure/api/admin-http-client";
import { revalidateContentCache } from "@/infrastructure/api/revalidate-client";
import { describeError } from "./news-form";

interface GallerySubcategoryOption {
  id: string;
  name: string;
  slug: string;
}

interface GalleryCategoryOption {
  id: string;
  name: string;
  slug: string;
  subcategories: GallerySubcategoryOption[];
}

export interface GalleryFormValues {
  title: string;
  description: string;
  galleryCategoryId: string;
  gallerySubcategoryId: string;
  eventDate: string;
  location: string;
  photographer: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  isFeatured: boolean;
  coverImage: string;
}

export const EMPTY_GALLERY_VALUES: GalleryFormValues = {
  title: "",
  description: "",
  galleryCategoryId: "",
  gallerySubcategoryId: "",
  eventDate: "",
  location: "",
  photographer: "",
  status: "DRAFT",
  isFeatured: false,
  coverImage: "",
};

/** Only the album-level fields (title, category, cover, ...). Photo management
 * (bulk upload, reorder, captions, cover-from-photo) lives in
 * GalleryPhotoManager, rendered separately once the album exists. */
export function GalleryForm({
  galleryId,
  initialValues,
  onCreated,
}: {
  galleryId?: string;
  initialValues?: GalleryFormValues;
  onCreated?: (id: string) => void;
}) {
  const router = useRouter();
  const [values, setValues] = useState<GalleryFormValues>(initialValues ?? EMPTY_GALLERY_VALUES);
  const [categories, setCategories] = useState<GalleryCategoryOption[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState<"draft" | "publish" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminGet<GalleryCategoryOption[]>("/public/gallery-categories").then(setCategories);
  }, []);

  const activeCategory = categories.find((c) => c.id === values.galleryCategoryId);

  function handleCoverUpload(file: File) {
    if (!values.title.trim()) {
      setError("Preencha o título antes de carregar a imagem de capa.");
      return;
    }
    setError(null);
    setUploading(true);
    adminUploadFile("galleries", file, values.title)
      .then((result) => setValues((v) => ({ ...v, coverImage: result.url })))
      .catch((err) => setError(describeError(err, "Não foi possível carregar a imagem de capa.")))
      .finally(() => setUploading(false));
  }

  async function handleSubmit(intent: "draft" | "publish") {
    setError(null);
    if (!values.title.trim()) {
      setError("Preencha o título da galeria.");
      return;
    }
    if (!values.galleryCategoryId) {
      setError("Seleccione uma categoria.");
      return;
    }
    if (!values.eventDate) {
      setError("Preencha a data da galeria.");
      return;
    }
    if (!values.coverImage) {
      setError("Carregue a imagem de capa.");
      return;
    }

    setSaving(intent);
    try {
      const payload = {
        title: values.title,
        description: values.description || undefined,
        galleryCategoryId: values.galleryCategoryId,
        gallerySubcategoryId: values.gallerySubcategoryId || null,
        eventDate: new Date(values.eventDate).toISOString(),
        location: values.location || undefined,
        photographer: values.photographer || undefined,
        isFeatured: values.isFeatured,
        coverImage: values.coverImage,
        status: intent === "publish" ? "PUBLISHED" : galleryId ? undefined : "DRAFT",
      };

      if (galleryId) {
        await adminPatch(`/admin/galleries/${galleryId}`, payload);
        try {
          sessionStorage.setItem("admin_flash", intent === "publish" ? "Galeria publicada com sucesso." : "Alterações guardadas com sucesso.");
        } catch {
          // sessionStorage indisponível.
        }
        await revalidateContentCache(["galleries"]);
        router.push("/admin/galleries");
      } else {
        const gallery = await adminPost<{ id: string }>("/admin/galleries", payload);
        await revalidateContentCache(["galleries"]);
        if (onCreated) {
          onCreated(gallery.id);
        } else {
          try {
            sessionStorage.setItem("admin_flash", "Galeria criada com sucesso. Adicione agora as fotografias.");
          } catch {
            // sessionStorage indisponível.
          }
          router.push(`/admin/galleries/${gallery.id}`);
        }
      }
    } catch (err) {
      setError(describeError(err, "Não foi possível guardar a galeria."));
    } finally {
      setSaving(null);
    }
  }

  const canPublish = values.status !== "PUBLISHED";
  const busy = saving !== null;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <label className="mb-1.5 block text-xs font-medium text-foreground/70">Título da Galeria</label>
        <input
          required
          value={values.title}
          onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
          className="w-full rounded-lg border border-border-subtle bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-brand-500"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-foreground/70">Resumo</label>
        <textarea
          rows={3}
          value={values.description}
          onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
          className="w-full resize-none rounded-lg border border-border-subtle bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-brand-500"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground/70">Categoria</label>
          <select
            required
            value={values.galleryCategoryId}
            onChange={(e) => setValues((v) => ({ ...v, galleryCategoryId: e.target.value, gallerySubcategoryId: "" }))}
            className="w-full rounded-lg border border-border-subtle bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-brand-500"
          >
            <option value="">Seleccione...</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        {activeCategory && activeCategory.subcategories.length > 0 ? (
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/70">Subcategoria</label>
            <select
              value={values.gallerySubcategoryId}
              onChange={(e) => setValues((v) => ({ ...v, gallerySubcategoryId: e.target.value }))}
              className="w-full rounded-lg border border-border-subtle bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-brand-500"
            >
              <option value="">— Sem subcategoria —</option>
              {activeCategory.subcategories.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-foreground/70">Data da Galeria / Publicação</label>
        <input
          required
          type="datetime-local"
          value={values.eventDate}
          onChange={(e) => setValues((v) => ({ ...v, eventDate: e.target.value }))}
          className="w-full max-w-xs rounded-lg border border-border-subtle bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 sm:w-auto"
        />
        <p className="mt-1.5 text-xs text-foreground/50">
          Data original da galeria — determina a posição cronológica no portal, mesmo para álbuns históricos migrados hoje.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground/70">Local (opcional)</label>
          <input
            value={values.location}
            onChange={(e) => setValues((v) => ({ ...v, location: e.target.value }))}
            className="w-full rounded-lg border border-border-subtle bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-brand-500"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground/70">Fotógrafo / Créditos (opcional)</label>
          <input
            value={values.photographer}
            onChange={(e) => setValues((v) => ({ ...v, photographer: e.target.value }))}
            className="w-full rounded-lg border border-border-subtle bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-brand-500"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-foreground/70">Imagem de Capa</label>
        <input
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={(e) => e.target.files?.[0] && handleCoverUpload(e.target.files[0])}
          className="text-sm"
        />
        {uploading ? <p className="mt-1 text-xs text-foreground/50">A carregar...</p> : null}
        {values.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={values.coverImage} alt={values.title} className="mt-3 h-40 w-full max-w-md rounded-lg object-cover" />
        ) : null}
        <p className="mt-1.5 text-xs text-foreground/50">
          Pode ser substituída depois seleccionando qualquer fotografia da galeria como nova capa.
        </p>
      </div>

      <label className="flex items-center gap-2 text-sm text-foreground/70">
        <input type="checkbox" checked={values.isFeatured} onChange={(e) => setValues((v) => ({ ...v, isFeatured: e.target.checked }))} />
        Destaque
      </label>

      {error ? (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => handleSubmit("draft")}
          className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {saving === "draft" ? "A guardar..." : galleryId ? "Guardar Alterações" : "Criar Rascunho"}
        </button>
        {canPublish ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => handleSubmit("publish")}
            className="rounded-lg border-2 border-brand-600 px-5 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-600/5 disabled:opacity-50 dark:text-brand-400"
          >
            {saving === "publish" ? "A publicar..." : "Publicar Galeria"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
