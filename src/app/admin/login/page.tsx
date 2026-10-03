"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { HiOutlineEye, HiOutlineEyeSlash } from "react-icons/hi2";
import { ApiError } from "@/infrastructure/api/http-client";
import { useAdminAuth } from "@/presentation/admin/auth-context";

export default function AdminLoginPage() {
  const { login, user, loading } = useAdminAuth();
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/admin/dashboard");
  }, [loading, user, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError("Informe o email/utilizador e a senha.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await login(identifier, password);
      router.push("/admin/dashboard");
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 401
          ? "Email/utilizador ou senha incorrectos."
          : "Não foi possível comunicar com o servidor. Tente novamente."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-950 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
        <div className="mx-auto mb-6 h-12 w-40 relative">
          <Image src="/images/logotipo_endiama.png" alt="ENDIAMA" fill sizes="160px" className="object-contain brightness-0 invert" />
        </div>
        <h1 className="text-center font-heading text-lg font-medium text-white">Painel Administrativo</h1>
        <p className="mt-1 text-center text-xs text-white/50">Sala de Imprensa ENDIAMA E.P.</p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/70">Email ou utilizador</label>
            <input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoFocus
              className="w-full rounded-lg border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white outline-none transition-colors focus:border-gold-400"
              placeholder="admin@endiama.co.ao"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/70">Senha</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-white/5 px-3.5 py-2.5 pr-10 text-sm text-white outline-none transition-colors focus:border-gold-400"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-white/50 transition-colors hover:text-white focus:outline-none focus-visible:ring-1 focus-visible:ring-gold-400"
              >
                {showPassword ? <HiOutlineEyeSlash className="size-4.5" /> : <HiOutlineEye className="size-4.5" />}
              </button>
            </div>
          </div>

          {error ? <p className="text-xs text-red-400">{error}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 rounded-lg bg-gold-500 py-2.5 text-sm font-semibold text-brand-950 transition-colors hover:bg-gold-400 disabled:opacity-50"
          >
            {submitting ? "A entrar..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
