"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { adminGetPaginated, adminPatch, adminPost, adminUploadFile } from "@/infrastructure/api/admin-http-client";
import { revalidateContentCache } from "@/infrastructure/api/revalidate-client";
import { describeError } from "./news-form";

interface CategoryOption {
  id: string;
  name: string;
}

type VideoSourceType = "UPLOAD" | "YOUTUBE" | "VIMEO" | "EXTERNAL";

export interface VideoFormValues {
  title: string;
  description: string;
  categoryId: string;
  authorName: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  isFeatured: boolean;
  publishedAt: string;
  thumbnail: string;
  thumbnailAlt: string;
  videoType: VideoSourceType;
  videoUrl: string;
  duration: number;
}

export const EMPTY_VIDEO_VALUES: VideoFormValues = {
  title: "",
  description: "",
  categoryId: "",
  authorName: "",
  status: "DRAFT",
  isFeatured: false,
  publishedAt: "",
  thumbnail: "",
  thumbnailAlt: "",
  videoType: "UPLOAD",
  videoUrl: "",
  duration: 0,
};

function extractYouTubeId(input: string): string | null {
  const trimmed = input.trim();
  const match = trimmed.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (match) return match[1];
  return /^[a-zA-Z0-9_-]{11}$/.test(trimmed) ? trimmed : null;
}

function extractVimeoId(input: string): string | null {
  const trimmed = input.trim();
  const match = trimmed.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (match) return match[1];
  return /^\d+$/.test(trimmed) ? trimmed : null;
}

function formatDurationLabel(seconds: number): string {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function VideoForm({ videoId, initialValues }: { videoId?: string; initialValues?: VideoFormValues }) {
  const router = useRouter();
  const [values, setValues] = useState<VideoFormValues>(initialValues ?? EMPTY_VIDEO_VALUES);
  const [sourceInput, setSourceInput] = useState(initialValues?.videoUrl ?? "");
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [saving, setSaving] = useState<"draft" | "publish" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const probeRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    adminGetPaginated<CategoryOption>("/admin/categories?limit=50").then((res) => setCategories(res.data));
  }, []);

  function handleThumbnailFile(file: File) {
    if (!values.thumbnailAlt.trim()) {
      setError("Preencha o texto alternativo da thumbnail antes de a carregar.");
      return;
    }
    setError(null);
    setUploadingThumb(true);
    adminUploadFile("videos", file, values.thumbnailAlt)
      .then((result) => setValues((v) => ({ ...v, thumbnail: result.url })))
      .catch((err) => setError(describeError(err, "Não foi possível carregar a thumbnail.")))
      .finally(() => setUploadingThumb(false));
  }

  function handleVideoFile(file: File) {
    setError(null);
    setUploadingVideo(true);
    adminUploadFile("videos", file)
      .then((result) => {
        setValues((v) => ({ ...v, videoUrl: result.url }));
        // Best-effort duration detection from the uploaded file itself.
        const probe = document.createElement("video");
        probe.preload = "metadata";
        probe.onloadedmetadata = () => {
          setValues((v) => ({ ...v, duration: Math.round(probe.duration) || v.duration }));
          URL.revokeObjectURL(probe.src);
        };
        probe.src = URL.createObjectURL(file);
        probeRef.current = probe;
      })
      .catch((err) => setError(describeError(err, "Não foi possível carregar o vídeo.")))
      .finally(() => setUploadingVideo(false));
  }

  function handleSourceBlur() {
    if (values.videoType === "UPLOAD") return;
    setError(null);
    if (!sourceInput.trim()) {
      setValues((v) => ({ ...v, videoUrl: "" }));
      return;
    }
    if (values.videoType === "YOUTUBE") {
      const id = extractYouTubeId(sourceInput);
      if (!id) {
        setError("URL do YouTube inválida. Utilize um link como https://www.youtube.com/watch?v=XXXXXXXXXXX.");
        return;
      }
      setValues((v) => ({
        ...v,
        videoUrl: id,
        thumbnail: v.thumbnail || `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
        thumbnailAlt: v.thumbnailAlt || v.title || "Miniatura do vídeo do YouTube",
      }));
      setSourceInput(id);
    } else if (values.videoType === "VIMEO") {
      const id = extractVimeoId(sourceInput);
      if (!id) {
        setError("URL do Vimeo inválida. Utilize um link como https://vimeo.com/XXXXXXXXX.");
        return;
      }
      setValues((v) => ({ ...v, videoUrl: id }));
      setSourceInput(id);
    } else {
      // EXTERNAL: store the direct URL as-is.
      setValues((v) => ({ ...v, videoUrl: sourceInput.trim() }));
    }
  }

  function handleSourceTypeChange(type: VideoSourceType) {
    setValues((v) => ({ ...v, videoType: type, videoUrl: "" }));
    setSourceInput("");
    setError(null);
  }

  async function handleSubmit(intent: "draft" | "publish") {
    setError(null);
    if (!values.title.trim()) {
      setError("Preencha o título do vídeo.");
      return;
    }
    if (!values.categoryId) {
      setError("Seleccione uma categoria.");
      return;
    }
    if (!values.thumbnail) {
      setError("Carregue a thumbnail do vídeo.");
      return;
    }
    if (!values.thumbnailAlt.trim()) {
      setError("Preencha o texto alternativo da thumbnail.");
      return;
    }
    if (!values.videoUrl) {
      setError(
        values.videoType === "UPLOAD" ? "Carregue o ficheiro de vídeo." : "Indique e valide a URL do vídeo (saia do campo para validar)."
      );
      return;
    }

    setSaving(intent);
    try {
      const payload = {
        title: values.title,
        description: values.description || undefined,
        categoryId: values.categoryId,
        authorName: values.authorName || undefined,
        isFeatured: values.isFeatured,
        thumbnail: values.thumbnail,
        thumbnailAlt: values.thumbnailAlt,
        videoType: values.videoType,
        videoUrl: values.videoUrl,
        duration: values.duration || undefined,
        publishedAt: values.publishedAt ? new Date(values.publishedAt).toISOString() : undefined,
        status: intent === "publish" ? "PUBLISHED" : videoId ? undefined : "DRAFT",
      };

      if (videoId) {
        await adminPatch(`/admin/videos/${videoId}`, payload);
      } else {
        await adminPost("/admin/videos", payload);
      }

      try {
        sessionStorage.setItem("admin_flash", intent === "publish" ? "Vídeo publicado com sucesso." : videoId ? "Alterações guardadas com sucesso." : "Rascunho de vídeo criado com sucesso.");
      } catch {
        // sessionStorage indisponível — sem mensagem, sem quebrar o fluxo.
      }
      await revalidateContentCache(["videos"]);
      router.push("/admin/videos");
    } catch (err) {
      setError(describeError(err, "Não foi possível guardar o vídeo."));
    } finally {
      setSaving(null);
    }
  }

  const canPublish = values.status !== "PUBLISHED";
  const busy = saving !== null;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit("draft");
      }}
      className="max-w-3xl space-y-6"
    >
      <div>
        <label className="mb-1.5 block text-xs font-medium text-foreground/70">Título</label>
        <input
          required
          value={values.title}
          onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
          className="w-full rounded-lg border border-border-subtle bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-brand-500"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-foreground/70">Descrição</label>
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
            value={values.categoryId}
            onChange={(e) => setValues((v) => ({ ...v, categoryId: e.target.value }))}
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
        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground/70">Autor / Responsável</label>
          <input
            value={values.authorName}
            onChange={(e) => setValues((v) => ({ ...v, authorName: e.target.value }))}
            className="w-full rounded-lg border border-border-subtle bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-brand-500"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-foreground/70">Data de Publicação</label>
        <input
          type="datetime-local"
          value={values.publishedAt}
          onChange={(e) => setValues((v) => ({ ...v, publishedAt: e.target.value }))}
          className="w-full max-w-xs rounded-lg border border-border-subtle bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 sm:w-auto"
        />
        <p className="mt-1.5 text-xs text-foreground/50">
          Utilize este campo para definir a data original de publicação do vídeo. Deixe em branco para usar a data e hora
          actuais quando o vídeo for publicado.
        </p>
      </div>

      <div className="rounded-lg border border-border-subtle p-4">
        <label className="mb-1.5 block text-xs font-medium text-foreground/70">Tipo / Fonte do Vídeo</label>
        <select
          value={values.videoType}
          onChange={(e) => handleSourceTypeChange(e.target.value as VideoSourceType)}
          className="w-full max-w-xs rounded-lg border border-border-subtle bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-brand-500"
        >
          <option value="UPLOAD">Upload Local</option>
          <option value="YOUTUBE">YouTube</option>
          <option value="VIMEO">Vimeo</option>
          <option value="EXTERNAL">URL externa (ficheiro directo)</option>
        </select>

        {values.videoType === "UPLOAD" ? (
          <div className="mt-3">
            <label className="mb-1.5 block text-xs font-medium text-foreground/70">Ficheiro de vídeo (MP4 ou WebM)</label>
            <input
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              onChange={(e) => e.target.files?.[0] && handleVideoFile(e.target.files[0])}
              className="text-sm"
            />
            {uploadingVideo ? <p className="mt-1 text-xs text-foreground/50">A carregar vídeo...</p> : null}
            {values.videoUrl ? (
              <p className="mt-1.5 text-xs text-brand-600">
                Vídeo carregado{values.duration ? ` · duração detectada: ${formatDurationLabel(values.duration)}` : ""}
              </p>
            ) : null}
          </div>
        ) : (
          <div className="mt-3">
            <label className="mb-1.5 block text-xs font-medium text-foreground/70">
              {values.videoType === "YOUTUBE" ? "URL do YouTube" : values.videoType === "VIMEO" ? "URL do Vimeo" : "URL directa do ficheiro de vídeo"}
            </label>
            <input
              value={sourceInput}
              onChange={(e) => setSourceInput(e.target.value)}
              onBlur={handleSourceBlur}
              placeholder={
                values.videoType === "YOUTUBE"
                  ? "https://www.youtube.com/watch?v=XXXXXXXXXXX"
                  : values.videoType === "VIMEO"
                    ? "https://vimeo.com/XXXXXXXXX"
                    : "https://.../video.mp4"
              }
              className="w-full rounded-lg border border-border-subtle bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-brand-500"
            />
            {values.videoUrl && values.videoType !== "EXTERNAL" ? (
              <p className="mt-1.5 text-xs text-brand-600">URL validada — ID: {values.videoUrl}</p>
            ) : null}
            <div>
              <label className="mb-1.5 mt-3 block text-xs font-medium text-foreground/70">Duração (segundos, opcional)</label>
              <input
                type="number"
                min={0}
                value={values.duration || ""}
                onChange={(e) => setValues((v) => ({ ...v, duration: Number(e.target.value) || 0 }))}
                className="w-full max-w-[160px] rounded-lg border border-border-subtle bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-brand-500"
              />
            </div>
          </div>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-foreground/70">Texto alternativo da thumbnail</label>
        <input
          value={values.thumbnailAlt}
          onChange={(e) => setValues((v) => ({ ...v, thumbnailAlt: e.target.value }))}
          className="w-full rounded-lg border border-border-subtle bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-brand-500"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-foreground/70">Thumbnail / imagem de capa</label>
        <input
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={(e) => e.target.files?.[0] && handleThumbnailFile(e.target.files[0])}
          className="text-sm"
        />
        {uploadingThumb ? <p className="mt-1 text-xs text-foreground/50">A carregar...</p> : null}
        {values.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={values.thumbnail} alt={values.thumbnailAlt} className="mt-3 h-40 w-full max-w-md rounded-lg object-cover" />
        ) : null}
        {values.videoType === "YOUTUBE" && values.videoUrl ? (
          <p className="mt-1.5 text-xs text-foreground/50">
            Preenchida automaticamente a partir do YouTube — pode carregar uma imagem própria para a substituir.
          </p>
        ) : null}
      </div>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm text-foreground/70">
          <input
            type="checkbox"
            checked={values.isFeatured}
            onChange={(e) => setValues((v) => ({ ...v, isFeatured: e.target.checked }))}
          />
          Destaque
        </label>
        {videoId ? (
          <div className="flex items-center gap-2 text-sm text-foreground/70">
            <label>Estado</label>
            <select
              value={values.status}
              onChange={(e) => setValues((v) => ({ ...v, status: e.target.value as VideoFormValues["status"] }))}
              className="rounded-lg border border-border-subtle bg-surface px-3 py-1.5 text-sm outline-none focus:border-brand-500"
            >
              <option value="DRAFT">Rascunho</option>
              <option value="PUBLISHED">Publicado</option>
              <option value="ARCHIVED">Arquivado</option>
            </select>
          </div>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {saving === "draft" ? "A guardar..." : videoId ? "Guardar Alterações" : "Criar Rascunho"}
        </button>
        {canPublish ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => handleSubmit("publish")}
            className="rounded-lg border-2 border-brand-600 px-5 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-600/5 disabled:opacity-50 dark:text-brand-400"
          >
            {saving === "publish" ? "A publicar..." : "Publicar Vídeo"}
          </button>
        ) : null}
      </div>
    </form>
  );
}
