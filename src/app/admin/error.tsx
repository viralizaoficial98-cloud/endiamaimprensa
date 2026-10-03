"use client";

import { useEffect } from "react";

/** Admin-specific error boundary — shadows the public app/error.tsx for
 * everything under /admin/*, so an admin-side failure never shows the public
 * portal's copy/branding, and vice versa. */
export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-brand-950 px-6 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-400">Painel Administrativo</p>
      <h1 className="mt-3 font-heading text-2xl font-medium text-white sm:text-3xl">Não foi possível carregar esta página</h1>
      <p className="mt-3 max-w-md text-sm text-white/60">
        Estamos com dificuldades a comunicar com o servidor. Tente novamente dentro de instantes.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-full bg-gold-500 px-6 py-2.5 text-sm font-semibold text-brand-950 transition-colors hover:bg-gold-400"
      >
        Tentar novamente
      </button>
    </div>
  );
}
