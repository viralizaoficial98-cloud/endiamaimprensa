"use client";

import { useEffect, useState } from "react";
import { adminGetPaginated, adminUploadFile } from "@/infrastructure/api/admin-http-client";
import { describeError } from "@/presentation/admin/news-form-helpers";
import type { NewsBlockInput } from "./types";

interface ExistingVideoOption {
  id: string;
  title: string;
  thumbnail: string;
  videoUrl: string;
  videoType: "UPLOAD" | "YOUTUBE" | "VIMEO" | "EXTERNAL";
}

function extractYouTubeId(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{6,20})/);
  if (match) return match[1];
  return /^[A-Za-z0-9_-]{6,20}$/.test(trimmed) ? trimmed : "";
}

/** Two ways in: upload a file, or paste a YouTube URL/id — plus "seleccionar
 * vídeo existente" to reuse a Vídeos-module entry without re-uploading the
 * file (copies its already-hosted URL, never the file itself). */
export function VideoBlockEditor({ block, onChange }: { block: NewsBlockInput; onChange: (block: NewsBlockInput) => void }) {
  const [mode, setMode] = useState<"upload" | "youtube" | "existing">(block.videoType === "YOUTUBE" ? "youtube" : "upload");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingVideos, setExistingVideos] = useState<ExistingVideoOption[]>([]);

  useEffect(() => {
    if (mode !== "existing" || existingVideos.length > 0) return;
    adminGetPaginated<ExistingVideoOption>("/admin/videos?limit=100&status=PUBLISHED")
      .then((res) => setExistingVideos(res.data))
      .catch(() => setExistingVideos([]));
  }, [mode, existingVideos.length]);

  async function handleUpload(file: File) {
    setError(null);
    setUploading(true);
    try {
      const result = await adminUploadFile("news", file, block.title || "Vídeo da notícia");
      onChange({ ...block, videoType: "UPLOAD", videoUrl: result.url, thumbnailUrl: result.thumbnailUrl });
    } catch (err) {
      setError(describeError(err, "Não foi possível carregar o vídeo."));
    } finally {
      setUploading(false);
    }
  }

  function handleYoutubeInput(raw: string) {
    const id = extractYouTubeId(raw);
    onChange({ ...block, videoType: "YOUTUBE", videoUrl: id || raw });
  }

  function selectExisting(id: string) {
    const video = existingVideos.find((v) => v.id === id);
    if (!video) return;
    onChange({ ...block, videoType: video.videoType, videoUrl: video.videoUrl, thumbnailUrl: video.thumbnail, title: block.title || video.title });
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-[11px] font-medium text-foreground/70">Título (opcional)</label>
        <input
          value={block.title ?? ""}
          onChange={(e) => onChange({ ...block, title: e.target.value })}
          placeholder="Título do vídeo"
          className="w-full rounded-md border border-border-subtle bg-surface px-2.5 py-1.5 text-xs outline-none focus:border-brand-500"
        />
      </div>

      <div className="inline-flex rounded-md border border-border-subtle p-0.5 text-[11px]">
        {(["upload", "youtube", "existing"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`rounded px-2.5 py-1 font-medium transition-colors ${mode === m ? "bg-brand-600 text-white" : "text-foreground/60 hover:text-foreground"}`}
          >
            {m === "upload" ? "Carregar ficheiro" : m === "youtube" ? "YouTube" : "Vídeo existente"}
          </button>
        ))}
      </div>

      {mode === "upload" ? (
        <div>
          <input
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
            className="text-xs"
          />
          {uploading ? <p className="mt-1 text-[11px] text-foreground/50">A carregar...</p> : null}
        </div>
      ) : mode === "youtube" ? (
        <input
          placeholder="Cole a URL do YouTube ou o ID do vídeo"
          defaultValue={block.videoType === "YOUTUBE" ? block.videoUrl : ""}
          onBlur={(e) => handleYoutubeInput(e.target.value)}
          className="w-full rounded-md border border-border-subtle bg-surface px-2.5 py-1.5 text-xs outline-none focus:border-brand-500"
        />
      ) : (
        <select
          value={block.videoType && existingVideos.some((v) => v.videoUrl === block.videoUrl) ? existingVideos.find((v) => v.videoUrl === block.videoUrl)?.id : ""}
          onChange={(e) => selectExisting(e.target.value)}
          className="w-full rounded-md border border-border-subtle bg-surface px-2.5 py-1.5 text-xs outline-none focus:border-brand-500"
        >
          <option value="">Seleccione um vídeo já publicado...</option>
          {existingVideos.map((v) => (
            <option key={v.id} value={v.id}>
              {v.title}
            </option>
          ))}
        </select>
      )}

      {error ? <p className="text-[11px] text-red-500">{error}</p> : null}

      {block.videoUrl ? (
        <p className="text-[11px] text-foreground/50">
          {block.videoType === "YOUTUBE" ? `YouTube: ${block.videoUrl}` : "Ficheiro de vídeo carregado."}
        </p>
      ) : null}
    </div>
  );
}
