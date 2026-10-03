"use client";

import { useEffect, useState } from "react";
import { HiOutlinePause, HiOutlinePlay } from "react-icons/hi2";
import { adminDelete, adminGet, adminPatch, adminPost, adminUploadFile } from "@/infrastructure/api/admin-http-client";

type PublishStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

interface CategoryRow {
  id: string;
  name: string;
}

interface AudioRow {
  id: string;
  title: string;
  coverImage: string;
  audioUrl: string;
  duration: number;
  interviewee: string | null;
  isFeatured: boolean;
  status: PublishStatus;
  category: CategoryRow | null;
}

const EMPTY_FORM = {
  title: "",
  description: "",
  coverImage: "",
  audioUrl: "",
  duration: "",
  categoryId: "",
  interviewee: "",
  location: "",
  isFeatured: false,
  status: "DRAFT" as PublishStatus,
};

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export default function AdminAudiosPage() {
  const [rows, setRows] = useState<AudioRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [audiosRes, categoriesRes] = await Promise.all([
        adminGet<AudioRow[]>("/admin/audios?limit=100"),
        adminGet<CategoryRow[]>("/admin/categories?limit=100").catch(() => []),
      ]);
      setRows(audiosRes);
      setCategories(categoriesRes);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleUploadCover(file: File) {
    setUploadingCover(true);
    setError(null);
    try {
      const result = await adminUploadFile("audios", file, form.title || "Áudio ENDIAMA");
      setForm((f) => ({ ...f, coverImage: result.url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar imagem de capa.");
    } finally {
      setUploadingCover(false);
    }
  }

  async function handleUploadAudio(file: File) {
    setUploadingAudio(true);
    setError(null);
    try {
      const result = await adminUploadFile("audios", file);
      setForm((f) => ({ ...f, audioUrl: result.url }));
      const el = document.createElement("audio");
      el.preload = "metadata";
      el.src = URL.createObjectURL(file);
      el.onloadedmetadata = () => {
        if (Number.isFinite(el.duration)) setForm((f) => ({ ...f, duration: String(Math.round(el.duration)) }));
        URL.revokeObjectURL(el.src);
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar ficheiro de áudio.");
    } finally {
      setUploadingAudio(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.coverImage) {
      setError("Carregue uma imagem de capa antes de criar o áudio.");
      return;
    }
    if (!form.audioUrl) {
      setError("Carregue o ficheiro de áudio antes de criar o áudio.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await adminPost("/admin/audios", {
        title: form.title,
        description: form.description || undefined,
        coverImage: form.coverImage,
        audioUrl: form.audioUrl,
        duration: form.duration ? Number(form.duration) : undefined,
        categoryId: form.categoryId || undefined,
        interviewee: form.interviewee || undefined,
        location: form.location || undefined,
        isFeatured: form.isFeatured,
        status: form.status,
      });
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao criar áudio.");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(row: AudioRow, status: PublishStatus) {
    await adminPatch(`/admin/audios/${row.id}`, { status });
    load();
  }

  async function handleToggleFeatured(row: AudioRow) {
    await adminPatch(`/admin/audios/${row.id}`, { isFeatured: !row.isFeatured });
    load();
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Remover este áudio?")) return;
    await adminDelete(`/admin/audios/${id}`);
    load();
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-medium text-foreground">Áudios</h1>
      <p className="mt-1 text-sm text-foreground/50">
        Declarações, entrevistas em áudio, comunicados e outros conteúdos sonoros da Sala de Imprensa. Só áudios
        &quot;Publicados&quot; aparecem no portal.
      </p>

      <form onSubmit={handleCreate} className="mt-6 max-w-2xl space-y-3 rounded-xl border border-border-subtle bg-surface p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground/70">Título</label>
            <input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="w-full rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm outline-none focus:border-brand-500" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground/70">Categoria</label>
            <select value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))} className="w-full rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm outline-none focus:border-brand-500">
              <option value="">— Sem categoria —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground/70">Descrição curta</label>
          <textarea rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="w-full rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm outline-none focus:border-brand-500" />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground/70">Autor / Entrevistado</label>
            <input value={form.interviewee} onChange={(e) => setForm((f) => ({ ...f, interviewee: e.target.value }))} className="w-full rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm outline-none focus:border-brand-500" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground/70">Local</label>
            <input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} className="w-full rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm outline-none focus:border-brand-500" />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-foreground/70">Imagem de capa</label>
          <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleUploadCover(e.target.files[0])} className="text-sm" />
          {uploadingCover ? <p className="mt-1 text-xs text-foreground/50">A carregar...</p> : null}
          {form.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.coverImage} alt={form.title} className="mt-2 h-28 w-full max-w-xs rounded-lg object-cover" />
          ) : null}
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground/70">Ficheiro de áudio (MP3, M4A ou WAV)</label>
          <input type="file" accept="audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/mp4,.mp3,.m4a,.wav" onChange={(e) => e.target.files?.[0] && handleUploadAudio(e.target.files[0])} className="text-sm" />
          {uploadingAudio ? <p className="mt-1 text-xs text-foreground/50">A carregar...</p> : null}
          {form.audioUrl ? (
            <p className="mt-1 text-xs text-foreground/50">
              Carregado{form.duration ? ` · duração detectada: ${formatDuration(Number(form.duration))}` : ""}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground/70">Estado</label>
            <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as PublishStatus }))} className="rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm outline-none focus:border-brand-500">
              <option value="DRAFT">Rascunho</option>
              <option value="PUBLISHED">Publicado</option>
              <option value="ARCHIVED">Arquivado</option>
            </select>
          </div>
          <label className="flex items-center gap-2 pt-5 text-sm text-foreground/70">
            <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm((f) => ({ ...f, isFeatured: e.target.checked }))} />
            Destaque
          </label>
        </div>

        <button type="submit" disabled={saving} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50">
          {saving ? "A criar..." : "Criar Áudio"}
        </button>
        {error ? <p className="text-sm text-red-500">{error}</p> : null}
      </form>

      <div className="mt-6 space-y-2">
        {loading ? (
          <p className="text-sm text-foreground/40">A carregar...</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-foreground/40">Nenhum áudio registado ainda.</p>
        ) : (
          rows.map((row) => (
            <div key={row.id} className="flex items-center gap-4 rounded-xl border border-border-subtle bg-surface p-3">
              <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-surface-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={row.coverImage} alt={row.title} className="h-full w-full object-cover" />
                <button
                  type="button"
                  aria-label="Pré-visualizar"
                  onClick={() => setPreviewId(previewId === row.id ? null : row.id)}
                  className="absolute inset-0 flex items-center justify-center bg-black/30 text-white"
                >
                  {previewId === row.id ? <HiOutlinePause className="size-5" /> : <HiOutlinePlay className="size-5" />}
                </button>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{row.title}</p>
                <p className="truncate text-xs text-foreground/50">
                  {row.category?.name ?? "Sem categoria"} · {formatDuration(row.duration)}
                  {row.interviewee ? ` · ${row.interviewee}` : ""}
                </p>
                {previewId === row.id ? (
                  <audio src={row.audioUrl} controls autoPlay preload="metadata" className="mt-2 h-8 w-full max-w-sm" onEnded={() => setPreviewId(null)} />
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleToggleFeatured(row)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium ${row.isFeatured ? "bg-gold-500/15 text-gold-700" : "bg-foreground/10 text-foreground/50"}`}
                >
                  {row.isFeatured ? "Destaque" : "Normal"}
                </button>
                <select
                  value={row.status}
                  onChange={(e) => handleStatusChange(row, e.target.value as PublishStatus)}
                  className="rounded-md border border-border-subtle bg-background px-2 py-1 text-xs"
                >
                  <option value="DRAFT">Rascunho</option>
                  <option value="PUBLISHED">Publicado</option>
                  <option value="ARCHIVED">Arquivado</option>
                </select>
                <button type="button" onClick={() => handleDelete(row.id)} className="text-xs font-medium text-red-500 hover:underline">
                  Remover
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
