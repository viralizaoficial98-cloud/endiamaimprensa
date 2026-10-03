import Link from "next/link";

export default function AdminNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-brand-950 px-6 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-400">404</p>
      <h1 className="mt-3 font-heading text-2xl font-medium text-white sm:text-3xl">Página não encontrada</h1>
      <p className="mt-3 max-w-md text-sm text-white/60">A página do painel que procura não existe ou foi movida.</p>
      <Link
        href="/admin/dashboard"
        className="mt-6 rounded-full bg-gold-500 px-6 py-2.5 text-sm font-semibold text-brand-950 transition-colors hover:bg-gold-400"
      >
        Voltar ao painel
      </Link>
    </div>
  );
}
