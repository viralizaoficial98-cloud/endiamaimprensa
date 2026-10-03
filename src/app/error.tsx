"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">ENDIAMA Notícias</p>
      <h1 className="mt-3 font-heading text-2xl font-medium text-foreground sm:text-3xl">Não foi possível carregar esta página</h1>
      <p className="mt-3 max-w-md text-sm text-foreground/60">
        Estamos com dificuldades a comunicar com o servidor. Tente novamente dentro de instantes.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-full bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
      >
        Tentar novamente
      </button>
    </div>
  );
}
