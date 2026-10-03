import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">404</p>
      <h1 className="mt-3 font-heading text-2xl font-medium text-foreground sm:text-3xl">Página não encontrada</h1>
      <p className="mt-3 max-w-md text-sm text-foreground/60">A página que procura não existe ou foi movida.</p>
      <Link
        href="/"
        className="mt-6 rounded-full bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
      >
        Voltar ao início
      </Link>
    </div>
  );
}
