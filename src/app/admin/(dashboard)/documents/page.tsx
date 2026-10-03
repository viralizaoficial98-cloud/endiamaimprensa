"use client";

import { useEffect, useMemo, useState } from "react";
import { adminDelete, adminGetPaginated, adminPatch, adminPost, adminUploadFile } from "@/infrastructure/api/admin-http-client";

interface CategoryOption {
  id: string;
  name: string;
}

interface DocumentRow {
  id: string;
  title: string;
  description: string | null;
  category: CategoryOption | null;
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  documentDate: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
}

const EMPTY_FORM = {
  title: "",
  description: "",
  categoryId: "",
  documentDate: "",
  fileUrl: "",
  fileName: "",
  fileType: "PDF",
  fileSize: 0,
};

export default function AdminDocumentsPage() {
  const [rows, setRows] = useState<DocumentRow[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [docsRes, catsRes] = await Promise.all([
        adminGetPaginated<DocumentRow>("/admin/documents?limit=200"),
        adminGetPaginated<CategoryOption>("/admin/categories?limit=50"),
      ]);
      setRows(docsRes.data);
      setCategories(catsRes.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(
    () => rows.filter((r) => r.title.toLowerCase().includes(search.trim().toLowerCase())),
    [rows, search]
  );

  async function handleUpload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const result = await adminUploadFile("documents", file);
      const ext = file.name.split(".").pop()?.toUpperCase() ?? "PDF";
      const fileType = ["PDF", "DOCX", "XLSX", "PPTX", "ZIP"].includes(ext) ? ext : "OTHER";
      setForm((f) => ({ ...f, fileUrl: result.url, fileName: file.name, fileType, fileSize: file.size }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar ficheiro.");
    } finally {
      setUploading(false);
    }
  }

  function startEdit(row: DocumentRow) {
    setEditingId(row.id);
    setForm({
      title: row.title,
      description: row.description ?? "",
      categoryId: row.category?.id ?? "",
      documentDate: row.documentDate ? row.documentDate.slice(0, 10) : "",
      fileUrl: row.fileUrl,
      fileName: row.fileName,
      fileType: row.fileType,
      fileSize: row.fileSize,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fileUrl) {
      setError("Carregue um ficheiro antes de guardar.");
      return;
    }
    setSaving(true);
    setError(null);
    const payload = {
      title: form.title,
      description: form.description || undefined,
      categoryId: form.categoryId || undefined,
      documentDate: form.documentDate ? new Date(form.documentDate).toISOString() : undefined,
      fileUrl: form.fileUrl,
      fileName: form.fileName,
      fileType: form.fileType,
      fileSize: form.fileSize,
    };
    try {
      if (editingId) {
        await adminPatch(`/admin/documents/${editingId}`, payload);
      } else {
        await adminPost("/admin/documents", payload);
      }
      cancelEdit();
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao guardar documento.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(row: DocumentRow) {
    const status = row.status === "PUBLISHED" ? "ARCHIVED" : "PUBLISHED";
    await adminPatch(`/admin/documents/${row.id}`, { status });
    load();
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Remover este documento?")) return;
    await adminDelete(`/admin/documents/${id}`);
    load();
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-medium text-foreground">Documentos</h1>
      <p className="mt-1 text-sm text-foreground/50">Gestão da biblioteca documental institucional.</p>

      <form onSubmit={handleSubmit} className="mt-6 max-w-xl space-y-3 rounded-xl border border-border-subtle bg-surface p-4">
        <p className="text-sm font-medium text-foreground">{editingId ? "Editar documento" : "Adicionar documento"}</p>
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground/70">Título</label>
          <input
            required
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="w-full rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
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
        <div className="grid grid-cols-2 gap-3">
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
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground/70">Data do documento</label>
            <input
              type="date"
              value={form.documentDate}
              onChange={(e) => setForm((f) => ({ ...f, documentDate: e.target.value }))}
              className="w-full rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm outline-none focus:border-brand-500"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground/70">Ficheiro (PDF, DOC/DOCX, XLS/XLSX, PPT/PPTX)</label>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip"
            onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
            className="text-sm"
          />
          {uploading ? <p className="mt-1 text-xs text-foreground/50">A carregar...</p> : null}
          {form.fileName ? <p className="mt-1 text-xs text-foreground/60">Ficheiro: {form.fileName}</p> : null}
        </div>
        <div className="flex items-center gap-2">
          <button type="submit" disabled={saving} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50">
            {saving ? "A guardar..." : editingId ? "Guardar alterações" : "Criar documento"}
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
          placeholder="Pesquisar documentos..."
          className="w-full max-w-sm rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm outline-none focus:border-brand-500"
        />
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-border-subtle">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border-subtle bg-surface-muted text-xs uppercase tracking-wide text-foreground/50">
              <th className="px-4 py-3 font-medium">Título</th>
              <th className="px-4 py-3 font-medium">Categoria</th>
              <th className="px-4 py-3 font-medium">Formato</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium text-right">Acções</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-4 py-6 text-foreground/40" colSpan={5}>A carregar...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td className="px-4 py-6 text-foreground/40" colSpan={5}>Nenhum documento encontrado.</td></tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.id} className="border-b border-border-subtle last:border-0">
                  <td className="px-4 py-3 text-foreground">{row.title}</td>
                  <td className="px-4 py-3 text-foreground/70">{row.category?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-foreground/70">{row.fileType}</td>
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
