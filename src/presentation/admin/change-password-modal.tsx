"use client";

import { useState } from "react";
import { adminPost } from "@/infrastructure/api/admin-http-client";
import { describeError } from "./news-form";
import { useAdminAuth } from "./auth-context";

export function ChangePasswordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { refreshUser } = useAdminAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 8) {
      setError("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("A confirmação não coincide com a nova senha.");
      return;
    }
    setSaving(true);
    try {
      await adminPost("/auth/change-password", { currentPassword, newPassword });
      await refreshUser();
      onClose();
    } catch (err) {
      setError(describeError(err, "Não foi possível alterar a senha."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm space-y-4 rounded-2xl bg-surface p-6 shadow-2xl"
      >
        <div>
          <h2 className="font-heading text-lg font-medium text-foreground">Alterar Senha</h2>
          <p className="mt-1 text-xs text-foreground/50">É necessário definir uma nova senha para continuar a utilizar o painel.</p>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-foreground/70">Senha actual</label>
          <input
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground/70">Nova senha</label>
          <input
            type="password"
            required
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground/70">Confirmar nova senha</label>
          <input
            type="password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
        </div>

        {error ? <p className="text-sm text-red-500">{error}</p> : null}

        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {saving ? "A guardar..." : "Guardar nova senha"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border-subtle px-4 py-2.5 text-sm font-medium text-foreground/70 hover:bg-surface-muted"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
