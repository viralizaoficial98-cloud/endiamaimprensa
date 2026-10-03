"use client";

import { useEffect, useMemo, useState } from "react";
import { adminDelete, adminGetPaginated, adminPatch, adminPost, adminUploadFile } from "@/infrastructure/api/admin-http-client";

interface CategoryOption {
  id: string;
  name: string;
}

type MediaType = "IMPRENSA_ESCRITA" | "TELEVISAO" | "RADIO" | "PORTAL_DIGITAL" | "PUBLICACAO_ONLINE";

const MEDIA_TYPE_LABELS: Record<MediaType, string> = {
  IMPRENSA_ESCRITA: "Imprensa Escrita",
  TELEVISAO: "Televisão",
  RADIO: "Rádio",
  PORTAL_DIGITAL: "Portal Digital",
  PUBLICACAO_ONLINE: "Publicação Online",
};

interface ClippingRow {
  id: string;
  title: string;
  source: string;
  clippingDate: string;
  mediaType: MediaType;
  category: CategoryOption | null;
  description: string | null;
  url: string | null;
  documentUrl: string | null;
  imageUrl: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
}

const EMPTY_FORM = {
  title: "",
  source: "",
  clippingDate: "",
  mediaType: "PORTAL_DIGITAL" as MediaType,
  categoryId: "",
  description: "",
  url: "",
  documentUrl: "",
  imageUrl: "",
};

export default function AdminClippingPage() {
  const [rows, setRows] = useState<ClippingRow[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [clippingRes, catsRes] = await Promise.all([
        adminGetPaginated<ClippingRow>("/admin/clippings?limit=200"),
        adminGetPaginated<CategoryOption>("/admin/categories?limit=50"),
      ]);
      setRows(clippingRes.data);
      setCategories(catsRes.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(
    () => rows.filter((r) => r.title.toLowerCase().includes(search.trim().toLowerCase()) || r.source.toLowerCase().includes(search.trim().toLowerCase())),
    [rows, search]
  );

  function startEdit(row: ClippingRow) {
    setEditingId(row.id);
    setForm({
      title: row.title,
      source: row.source,
      clippingDate: row.clippingDate.slice(0, 10),
      mediaType: row.mediaType,
      categoryId: row.category?.id ?? "",
      description: row.description ?? "",
      url: row.url ?? "",
      documentUrl: row.documentUrl ?? "",
      imageUrl: row.imageUrl ?? "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.clippingDate) {
      setError("Indique a data do clipping.");
      return;
    }
    setSaving(true);
    setError(null);
    const payload = {
      title: form.title,
      source: form.source,
      clippingDate: new Date(form.clippingDate).toISOString(),
      mediaType: form.mediaType,
      categoryId: form.categoryId || undefined,
      description: form.description || undefined,
      url: form.url || undefined,
      documentUrl: form.documentUrl || undefined,
      imageUrl: form.imageUrl || undefined,
    };
    try {
      if (editingId) {
        await adminPatch(`/admin/clippings/${editingId}`, payload);
      } else {
        await adminPost("/admin/clippings", payload);
      }
      cancelEdit();
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao guardar clipping.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(row: ClippingRow) {
    const status = row.status === "PUBLISHED" ? "ARCHIVED" : "PUBLISHED";
    await adminPatch(`/admin/clippings/${row.id}`, { status });
    load();
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Remover este registo de clipping?")) return;
    await adminDelete(`/admin/clippings/${id}`);
    load();
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-medium text-foreground">Clipping</h1>
      <p className="mt-1 text-sm text-foreground/50">Gestão do clipping / monitorização de media.</p>

      <form onSubmit={handleSubmit} className="mt-6 max-w-xl space-y-3 rounded-xl border border-border-subtle bg-surface p-4">
        <p className="text-sm font-medium text-foreground">{editingId ? "Editar clipping" : "Adicionar clipping"}</p>
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground/70">Título</label>
          <input
            required
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="w-full rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground/70">Fonte</label>
            <input
              required
              value={form.source}
              onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
              className="w-full rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground/70">Data</label>
            <input
              required
              type="date"
              value={form.clippingDate}
              onChange={(e) => setForm((f) => ({ ...f, clippingDate: e.target.value }))}
              className="w-full rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm outline-none focus:border-brand-500"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground/70">Tipo de Media</label>
            <select
              value={form.mediaType}
              onChange={(e) => setForm((f) => ({ ...f, mediaType: e.target.value as MediaType }))}
              className="w-full rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm outline-none focus:border-brand-500"
            >
              {(Object.keys(MEDIA_TYPE_LABELS) as MediaType[]).map((type) => (
                <option key={type} value={type}>{MEDIA_TYPE_LABELS[type]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground/70">Categoria</label>
            <select
              value={form.categoryId}
              onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
              className="w-full rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm outline-none focus:border-brand-500"
            >
              <option value="">Seleccione...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground/70">Descrição</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={2}
            className="w-full rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground/70">URL da fonte (opcional)</label>
          <input
            type="url"
            value={form.url}
            onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
            placeholder="https://..."
            className="w-full rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground/70">Documento (PDF/imagem digitalizada)</label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setUploadingDoc(true);
                try {
                  const result = await adminUploadFile("clippings", file);
                  setForm((f) => ({ ...f, documentUrl: result.url }));
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Falha ao carregar documento.");
                } finally {
                  setUploadingDoc(false);
                }
              }}
              className="text-sm"
            />
            {uploadingDoc ? <p className="mt-1 text-xs text-foreground/50">A carregar...</p> : null}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground/70">Imagem / Thumbnail</label>
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setUploadingImg(true);
                try {
                  const result = await adminUploadFile("clippings", file);
                  setForm((f) => ({ ...f, imageUrl: result.url }));
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Falha ao carregar imagem.");
                } finally {
                  setUploadingImg(false);
                }
              }}
              className="text-sm"
            />
            {uploadingImg ? <p className="mt-1 text-xs text-foreground/50">A carregar...</p> : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="submit" disabled={saving} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50">
            {saving ? "A guardar..." : editingId ? "Guardar alterações" : "Criar clipping"}
          </button>
          {editingId ? (
            <button type="button" onClick={cancelEdit} className="rounded-lg border border-border-subtle px-4 py-2 text-sm font-medium text-foreground/70">
              Cancelar
            </button>
          ) : null}
        </div>
        {error ? <p className="text-sm text-red-500">{error}</p> : null}
      </form>

      <div className="mt-8">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar por título ou fonte..."
          className="w-full max-w-sm rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm outline-none focus:border-brand-500"
        />
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-border-subtle">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border-subtle bg-surface-muted text-xs uppercase tracking-wide text-foreground/50">
              <th className="px-4 py-3 font-medium">Título</th>
              <th className="px-4 py-3 font-medium">Fonte</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium text-right">Acções</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-4 py-6 text-foreground/40" colSpan={5}>A carregar...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td className="px-4 py-6 text-foreground/40" colSpan={5}>Nenhum registo encontrado.</td></tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.id} className="border-b border-border-subtle last:border-0">
                  <td className="px-4 py-3 text-foreground">{row.title}</td>
                  <td className="px-4 py-3 text-foreground/70">{row.source}</td>
                  <td className="px-4 py-3 text-foreground/70">{MEDIA_TYPE_LABELS[row.mediaType]}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleStatus(row)}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${row.status === "PUBLISHED" ? "bg-brand-600/10 text-brand-600" : "bg-foreground/10 text-foreground/60"}`}
                    >
                      {row.status === "PUBLISHED" ? "Publicado" : row.status === "DRAFT" ? "Rascunho" : "Arquivado"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" onClick={() => startEdit(row)} className="mr-3 text-xs font-medium text-brand-600 hover:underline">
                      Editar
                    </button>
                    <button type="button" onClick={() => handleDelete(row.id)} className="text-xs font-medium text-red-500 hover:underline">
                      Remover
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
