"use client";

import { useEffect, useState } from "react";
import { adminDelete, adminGet, adminPatch, adminPost, adminUploadFile } from "@/infrastructure/api/admin-http-client";
import { getPartnerInitials } from "@/lib/partner-initials";

interface PartnerRow {
  id: string;
  name: string;
  logo: string;
  website: string | null;
  description: string | null;
  order: number;
  status: "ACTIVE" | "INACTIVE";
}

const EMPTY_FORM = { name: "", logo: "", website: "", description: "", order: 0 };

export default function AdminPartnersPage() {
  const [rows, setRows] = useState<PartnerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      setRows(await adminGet<PartnerRow[]>("/admin/partners"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleUpload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const result = await adminUploadFile("partners", file, form.name || "Parceiro ENDIAMA");
      setForm((f) => ({ ...f, logo: result.url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar logótipo.");
    } finally {
      setUploading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await adminPost("/admin/partners", {
        name: form.name,
        logo: form.logo || "PLACEHOLDER",
        website: form.website || undefined,
        description: form.description || undefined,
        order: form.order,
      });
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao criar parceiro.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(row: PartnerRow) {
    await adminPatch(`/admin/partners/${row.id}`, { status: row.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" });
    load();
  }

  async function handleReorder(row: PartnerRow, direction: -1 | 1) {
    await adminPatch(`/admin/partners/${row.id}`, { order: row.order + direction });
    load();
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Remover este parceiro?")) return;
    await adminDelete(`/admin/partners/${id}`);
    load();
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-medium text-foreground">Parceiros</h1>
      <p className="mt-1 text-sm text-foreground/50">
        Gestão das instituições e empresas parceiras exibidas na secção &quot;Rede&quot; da homepage. Sem logótipo, é
        mostrado automaticamente um placeholder profissional com as iniciais do nome.
      </p>

      <form onSubmit={handleCreate} className="mt-6 max-w-xl space-y-3 rounded-xl border border-border-subtle bg-surface p-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground/70">Nome</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
          {form.name ? <p className="mt-1 text-xs text-foreground/40">Iniciais do placeholder: {getPartnerInitials(form.name)}</p> : null}
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground/70">Website</label>
          <input
            value={form.website}
            onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
            placeholder="https://..."
            className="w-full rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground/70">Descrição</label>
          <input
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="w-full rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground/70">Ordem</label>
          <input
            type="number"
            value={form.order}
            onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) }))}
            className="w-24 rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground/70">Logótipo (opcional — deixe vazio para usar placeholder)</label>
          <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} className="text-sm" />
          {uploading ? <p className="mt-1 text-xs text-foreground/50">A carregar...</p> : null}
          {form.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.logo} alt={form.name} className="mt-2 h-16 max-w-xs rounded-lg border border-border-subtle bg-white object-contain p-2" />
          ) : null}
        </div>
        <button type="submit" disabled={saving} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50">
          {saving ? "A criar..." : "Criar Parceiro"}
        </button>
        {error ? <p className="text-sm text-red-500">{error}</p> : null}
      </form>

      <div className="mt-6 space-y-2">
        {loading ? (
          <p className="text-sm text-foreground/40">A carregar...</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-foreground/40">Nenhum parceiro registado ainda.</p>
        ) : (
          rows
            .sort((a, b) => a.order - b.order)
            .map((row) => (
              <div key={row.id} className="flex items-center gap-4 rounded-xl border border-border-subtle bg-surface p-3">
                <div className="flex h-12 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white">
                  {row.logo && row.logo !== "PLACEHOLDER" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={row.logo} alt={row.name} className="max-h-10 w-auto object-contain" />
                  ) : (
                    <span className="text-[10px] font-semibold text-brand-700">{getPartnerInitials(row.name)}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{row.name}</p>
                  <p className="truncate text-xs text-foreground/50">{row.website || "sem website"} · ordem {row.order}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button type="button" onClick={() => handleReorder(row, -1)} className="rounded-md border border-border-subtle px-2 py-1 text-xs text-foreground/60 hover:border-brand-500">
                    ↑
                  </button>
                  <button type="button" onClick={() => handleReorder(row, 1)} className="rounded-md border border-border-subtle px-2 py-1 text-xs text-foreground/60 hover:border-brand-500">
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(row)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium ${row.status === "ACTIVE" ? "bg-brand-600/10 text-brand-700" : "bg-foreground/10 text-foreground/50"}`}
                  >
                    {row.status === "ACTIVE" ? "Activo" : "Inactivo"}
                  </button>
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
