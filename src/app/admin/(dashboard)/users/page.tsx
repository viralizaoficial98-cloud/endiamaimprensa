"use client";

import { useEffect, useState } from "react";
import { adminDelete, adminGet, adminGetPaginated, adminPatch, adminPost } from "@/infrastructure/api/admin-http-client";
import { describeError } from "@/presentation/admin/news-form";
import { useAdminAuth } from "@/presentation/admin/auth-context";

type UserStatus = "ACTIVE" | "INACTIVE" | "BLOCKED" | "PENDING";

interface RoleRow {
  id: string;
  name: string;
}

interface UserRow {
  id: string;
  name: string;
  email: string;
  username: string;
  position: string | null;
  department: string | null;
  status: UserStatus;
  mustChangePassword: boolean;
  role: RoleRow;
  lastLoginAt: string | null;
}

const STATUS_LABEL: Record<UserStatus, string> = {
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
  BLOCKED: "Bloqueado",
  PENDING: "Pendente",
};

const EMPTY_FORM = {
  name: "",
  email: "",
  username: "",
  password: "",
  position: "",
  department: "",
  roleId: "",
};

export default function AdminUsersPage() {
  const { hasPermission, user: currentUser } = useAdminAuth();
  const [rows, setRows] = useState<UserRow[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canCreate = hasPermission("users.create");
  const canUpdate = hasPermission("users.update");
  const canDelete = hasPermission("users.delete");

  async function load() {
    setLoading(true);
    try {
      const [usersRes, rolesRes] = await Promise.all([
        adminGetPaginated<UserRow>("/admin/users?limit=100"),
        adminGet<RoleRow[]>("/admin/roles"),
      ]);
      setRows(usersRes.data);
      setRoles(rolesRes);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.password.length < 8) {
      setError("A senha inicial deve ter pelo menos 8 caracteres.");
      return;
    }
    if (!form.roleId) {
      setError("Seleccione um perfil.");
      return;
    }
    setSaving(true);
    try {
      await adminPost("/admin/users", {
        name: form.name,
        email: form.email,
        username: form.username,
        password: form.password,
        position: form.position || undefined,
        department: form.department || undefined,
        roleId: form.roleId,
      });
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      setError(describeError(err, "Falha ao criar utilizador."));
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(row: UserRow, status: UserStatus) {
    await adminPatch(`/admin/users/${row.id}`, { status }).catch((err) => setError(describeError(err, "Falha ao actualizar estado.")));
    load();
  }

  async function handleRoleChange(row: UserRow, roleId: string) {
    await adminPatch(`/admin/users/${row.id}`, { roleId }).catch((err) => setError(describeError(err, "Falha ao actualizar perfil.")));
    load();
  }

  async function handleDelete(row: UserRow) {
    if (row.id === currentUser?.id) {
      setError("Não é possível eliminar a sua própria conta.");
      return;
    }
    if (!window.confirm(`Tem certeza de que pretende eliminar o utilizador "${row.name}"?`)) return;
    try {
      await adminDelete(`/admin/users/${row.id}`);
      load();
    } catch (err) {
      setError(describeError(err, "Falha ao eliminar utilizador."));
    }
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-medium text-foreground">Utilizadores</h1>
      <p className="mt-1 text-sm text-foreground/50">Gestão de contas e perfis de acesso ao painel administrativo.</p>

      {canCreate ? (
        <form onSubmit={handleCreate} className="mt-6 max-w-2xl space-y-3 rounded-xl border border-border-subtle bg-surface p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground/70">Nome</label>
              <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm outline-none focus:border-brand-500" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground/70">Nome de utilizador</label>
              <input required value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} className="w-full rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm outline-none focus:border-brand-500" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground/70">Email</label>
              <input required type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="w-full rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm outline-none focus:border-brand-500" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground/70">Senha inicial</label>
              <input required type="password" minLength={8} value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} className="w-full rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm outline-none focus:border-brand-500" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground/70">Cargo</label>
              <input value={form.position} onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))} className="w-full rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm outline-none focus:border-brand-500" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground/70">Departamento</label>
              <input value={form.department} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))} className="w-full rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm outline-none focus:border-brand-500" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground/70">Perfil</label>
            <select required value={form.roleId} onChange={(e) => setForm((f) => ({ ...f, roleId: e.target.value }))} className="w-full rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm outline-none focus:border-brand-500">
              <option value="">Seleccione...</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-foreground/45">
            O utilizador terá de definir uma nova senha no primeiro acesso (política mustChangePassword já existente no sistema).
          </p>
          <button type="submit" disabled={saving} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50">
            {saving ? "A criar..." : "Criar Utilizador"}
          </button>
          {error ? <p className="text-sm text-red-500">{error}</p> : null}
        </form>
      ) : error ? (
        <p className="mt-4 text-sm text-red-500">{error}</p>
      ) : null}

      <div className="mt-6 overflow-x-auto rounded-xl border border-border-subtle bg-surface">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-surface-muted text-left text-xs uppercase tracking-wide text-foreground/50">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Perfil</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Senha</th>
              <th className="px-4 py-3">Acções</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-foreground/40">
                  A carregar...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-foreground/40">
                  Nenhum utilizador encontrado.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-t border-border-subtle">
                  <td className="px-4 py-3 font-medium text-foreground">
                    {row.name}
                    {row.id === currentUser?.id ? <span className="ml-1.5 text-xs text-foreground/40">(você)</span> : null}
                  </td>
                  <td className="px-4 py-3 text-foreground/70">{row.email}</td>
                  <td className="px-4 py-3">
                    {canUpdate ? (
                      <select
                        value={row.role.id}
                        onChange={(e) => handleRoleChange(row, e.target.value)}
                        className="rounded-md border border-border-subtle bg-background px-2 py-1 text-xs"
                      >
                        {roles.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      row.role.name
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {canUpdate ? (
                      <select
                        value={row.status}
                        onChange={(e) => handleStatusChange(row, e.target.value as UserStatus)}
                        className="rounded-md border border-border-subtle bg-background px-2 py-1 text-xs"
                      >
                        {(Object.keys(STATUS_LABEL) as UserStatus[]).map((s) => (
                          <option key={s} value={s}>
                            {STATUS_LABEL[s]}
                          </option>
                        ))}
                      </select>
                    ) : (
                      STATUS_LABEL[row.status]
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-foreground/50">{row.mustChangePassword ? "Por alterar" : "Definida"}</td>
                  <td className="px-4 py-3">
                    {canDelete ? (
                      <button type="button" onClick={() => handleDelete(row)} className="text-xs font-medium text-red-500 hover:underline">
                        Eliminar
                      </button>
                    ) : null}
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
