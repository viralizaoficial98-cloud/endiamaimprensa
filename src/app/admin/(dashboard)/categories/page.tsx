"use client";

import { useEffect, useState } from "react";
import { adminDelete, adminGetPaginated, adminPost } from "@/infrastructure/api/admin-http-client";
import { revalidateContentCache } from "@/infrastructure/api/revalidate-client";

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  status: string;
}

export default function AdminCategoriesPage() {
  const [rows, setRows] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const result = await adminGetPaginated<CategoryRow>("/admin/categories?limit=100");
      setRows(result.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      await adminPost("/admin/categories", { name, description: description || undefined });
      setName("");
      setDescription("");
      await revalidateContentCache(["categories", "news"]);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao criar categoria.");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Remover esta categoria?")) return;
    try {
      await adminDelete(`/admin/categories/${id}`);
      await revalidateContentCache(["categories", "news"]);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao remover categoria.");
    }
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-medium text-foreground">Categorias</h1>
      <p className="mt-1 text-sm text-foreground/50">Gestão das categorias editoriais do portal.</p>

      <form onSubmit={handleCreate} className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border border-border-subtle bg-surface p-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground/70">Nome</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground/70">Descrição</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-72 rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
        </div>
        <button type="submit" disabled={creating} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50">
          {creating ? "A criar..." : "Criar Categoria"}
        </button>
      </form>

      {error ? <p className="mt-3 text-sm text-red-500">{error}</p> : null}

      <div className="mt-6 overflow-hidden rounded-xl border border-border-subtle bg-surface">
        <table className="w-full text-sm">
          <thead className="bg-surface-muted text-left text-xs uppercase tracking-wide text-foreground/50">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Acções</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-foreground/40">
                  A carregar...
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-t border-border-subtle">
                  <td className="px-4 py-3 font-medium text-foreground">{row.name}</td>
                  <td className="px-4 py-3 text-foreground/60">{row.slug}</td>
                  <td className="px-4 py-3 text-foreground/60">{row.status}</td>
                  <td className="px-4 py-3">
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
