"use client";

import { useEffect, useState } from "react";
import { adminDelete, adminGet, adminPatch, adminPost, adminUploadFile } from "@/infrastructure/api/admin-http-client";

type EventStatus = "DRAFT" | "UPCOMING" | "ONGOING" | "FINISHED" | "CANCELLED";

interface EventRow {
  id: string;
  title: string;
  coverImage: string;
  location: string | null;
  startDate: string;
  status: EventStatus;
}

const STATUS_OPTIONS: EventStatus[] = ["DRAFT", "UPCOMING", "ONGOING", "FINISHED", "CANCELLED"];

const EMPTY_FORM = {
  title: "",
  description: "",
  coverImage: "",
  location: "",
  address: "",
  startDate: "",
  endDate: "",
  startTime: "",
  endTime: "",
  organizer: "",
  registrationUrl: "",
  contactEmail: "",
  capacity: "",
  status: "UPCOMING" as EventStatus,
};

export default function AdminEventsPage() {
  const [rows, setRows] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      setRows(await adminGet<EventRow[]>("/admin/events"));
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
      const result = await adminUploadFile("events", file, form.title || "Evento ENDIAMA");
      setForm((f) => ({ ...f, coverImage: result.url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar imagem.");
    } finally {
      setUploading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.coverImage) {
      setError("Carregue uma imagem de capa antes de criar o evento.");
      return;
    }
    if (!form.startDate) {
      setError("Indique a data de início.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await adminPost("/admin/events", {
        title: form.title,
        description: form.description || undefined,
        coverImage: form.coverImage,
        location: form.location || undefined,
        address: form.address || undefined,
        startDate: new Date(form.startDate).toISOString(),
        endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
        startTime: form.startTime || undefined,
        endTime: form.endTime || undefined,
        organizer: form.organizer || undefined,
        registrationUrl: form.registrationUrl || undefined,
        contactEmail: form.contactEmail || undefined,
        capacity: form.capacity ? Number(form.capacity) : undefined,
        status: form.status,
      });
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao criar evento.");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(row: EventRow, status: EventStatus) {
    await adminPatch(`/admin/events/${row.id}`, { status });
    load();
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Remover este evento?")) return;
    await adminDelete(`/admin/events/${id}`);
    load();
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-medium text-foreground">Eventos</h1>
      <p className="mt-1 text-sm text-foreground/50">
        Agenda de eventos institucionais. Só eventos com estado &quot;Próximo&quot; ou &quot;Em Curso&quot; aparecem na homepage.
      </p>

      <form onSubmit={handleCreate} className="mt-6 max-w-2xl space-y-3 rounded-xl border border-border-subtle bg-surface p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground/70">Título</label>
            <input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="w-full rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm outline-none focus:border-brand-500" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground/70">Organizador</label>
            <input value={form.organizer} onChange={(e) => setForm((f) => ({ ...f, organizer: e.target.value }))} className="w-full rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm outline-none focus:border-brand-500" />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground/70">Descrição curta</label>
          <textarea rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="w-full rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm outline-none focus:border-brand-500" />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground/70">Local</label>
            <input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} className="w-full rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm outline-none focus:border-brand-500" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground/70">Endereço</label>
            <input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} className="w-full rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm outline-none focus:border-brand-500" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground/70">Início</label>
            <input type="datetime-local" required value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} className="w-full rounded-lg border border-border-subtle bg-background px-2 py-2 text-xs outline-none focus:border-brand-500" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground/70">Fim</label>
            <input type="datetime-local" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} className="w-full rounded-lg border border-border-subtle bg-background px-2 py-2 text-xs outline-none focus:border-brand-500" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground/70">Hora início</label>
            <input placeholder="09:00" value={form.startTime} onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))} className="w-full rounded-lg border border-border-subtle bg-background px-2 py-2 text-xs outline-none focus:border-brand-500" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground/70">Hora fim</label>
            <input placeholder="18:00" value={form.endTime} onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))} className="w-full rounded-lg border border-border-subtle bg-background px-2 py-2 text-xs outline-none focus:border-brand-500" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground/70">Inscrição (URL)</label>
            <input value={form.registrationUrl} onChange={(e) => setForm((f) => ({ ...f, registrationUrl: e.target.value }))} className="w-full rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm outline-none focus:border-brand-500" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground/70">Contacto (email)</label>
            <input value={form.contactEmail} onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))} className="w-full rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm outline-none focus:border-brand-500" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground/70">Capacidade</label>
            <input type="number" value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))} className="w-full rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm outline-none focus:border-brand-500" />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground/70">Estado</label>
          <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as EventStatus }))} className="rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm outline-none focus:border-brand-500">
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground/70">Imagem de capa (fotografia real)</label>
          <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} className="text-sm" />
          {uploading ? <p className="mt-1 text-xs text-foreground/50">A carregar...</p> : null}
          {form.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.coverImage} alt={form.title} className="mt-2 h-32 w-full max-w-sm rounded-lg object-cover" />
          ) : null}
        </div>
        <button type="submit" disabled={saving} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50">
          {saving ? "A criar..." : "Criar Evento"}
        </button>
        {error ? <p className="text-sm text-red-500">{error}</p> : null}
      </form>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p className="text-sm text-foreground/40">A carregar...</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-foreground/40">Nenhum evento registado ainda.</p>
        ) : (
          rows.map((row) => (
            <div key={row.id} className="overflow-hidden rounded-xl border border-border-subtle bg-surface">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={row.coverImage} alt={row.title} className="h-32 w-full object-cover" />
              <div className="p-3">
                <p className="text-sm font-medium text-foreground">{row.title}</p>
                <p className="text-xs text-foreground/50">{row.location ?? "—"} · {new Date(row.startDate).toLocaleDateString("pt-PT")}</p>
                <select
                  value={row.status}
                  onChange={(e) => handleStatusChange(row, e.target.value as EventStatus)}
                  className="mt-2 rounded-md border border-border-subtle bg-background px-2 py-1 text-xs"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <button type="button" onClick={() => handleDelete(row.id)} className="mt-2 block text-xs font-medium text-red-500 hover:underline">
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
