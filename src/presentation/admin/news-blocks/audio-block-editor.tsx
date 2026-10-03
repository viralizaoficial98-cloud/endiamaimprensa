"use client";

import { useEffect, useState } from "react";
import { adminGetPaginated, adminUploadFile } from "@/infrastructure/api/admin-http-client";
import { describeError } from "@/presentation/admin/news-form-helpers";
import type { NewsBlockInput } from "./types";

interface ExistingAudioOption {
  id: string;
  title: string;
  audioUrl: string;
}

/** Upload a file, or reuse an existing Áudios-module entry (copies its URL —
 * the file itself is never duplicated). */
export function AudioBlockEditor({ block, onChange }: { block: NewsBlockInput; onChange: (block: NewsBlockInput) => void }) {
  const [mode, setMode] = useState<"upload" | "existing">("upload");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingAudios, setExistingAudios] = useState<ExistingAudioOption[]>([]);

  useEffect(() => {
    if (mode !== "existing" || existingAudios.length > 0) return;
    adminGetPaginated<ExistingAudioOption>("/admin/audios?limit=100&status=PUBLISHED")
      .then((res) => setExistingAudios(res.data))
      .catch(() => setExistingAudios([]));
  }, [mode, existingAudios.length]);

  async function handleUpload(file: File) {
    setError(null);
    setUploading(true);
    try {
      const result = await adminUploadFile("news", file, block.title || "Áudio da notícia");
      onChange({ ...block, audioUrl: result.url });
    } catch (err) {
      setError(describeError(err, "Não foi possível carregar o áudio."));
    } finally {
      setUploading(false);
    }
  }

  function selectExisting(id: string) {
    const audio = existingAudios.find((a) => a.id === id);
    if (!audio) return;
    onChange({ ...block, audioUrl: audio.audioUrl, title: block.title || audio.title });
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-[11px] font-medium text-foreground/70">Título (opcional)</label>
        <input
          value={block.title ?? ""}
          onChange={(e) => onChange({ ...block, title: e.target.value })}
          placeholder="Título do áudio"
          className="w-full rounded-md border border-border-subtle bg-surface px-2.5 py-1.5 text-xs outline-none focus:border-brand-500"
        />
      </div>

      <div className="inline-flex rounded-md border border-border-subtle p-0.5 text-[11px]">
        {(["upload", "existing"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`rounded px-2.5 py-1 font-medium transition-colors ${mode === m ? "bg-brand-600 text-white" : "text-foreground/60 hover:text-foreground"}`}
          >
            {m === "upload" ? "Carregar ficheiro" : "Áudio existente"}
          </button>
        ))}
      </div>

      {mode === "upload" ? (
        <div>
          <input
            type="file"
            accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/mp4,audio/x-m4a"
            onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
            className="text-xs"
          />
          {uploading ? <p className="mt-1 text-[11px] text-foreground/50">A carregar...</p> : null}
        </div>
      ) : (
        <select
          value={existingAudios.find((a) => a.audioUrl === block.audioUrl)?.id ?? ""}
          onChange={(e) => selectExisting(e.target.value)}
          className="w-full rounded-md border border-border-subtle bg-surface px-2.5 py-1.5 text-xs outline-none focus:border-brand-500"
        >
          <option value="">Seleccione um áudio já publicado...</option>
          {existingAudios.map((a) => (
            <option key={a.id} value={a.id}>
              {a.title}
            </option>
          ))}
        </select>
      )}

      {error ? <p className="text-[11px] text-red-500">{error}</p> : null}
      {block.audioUrl ? (
        <audio controls src={block.audioUrl} className="h-9 w-full max-w-sm">
          <track kind="captions" />
        </audio>
      ) : null}
    </div>
  );
}
