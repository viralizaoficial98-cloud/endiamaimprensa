import { FlagGB, FlagPT } from "@/presentation/components/layout/flag-icons";

/** Discreet PT/EN completion indicator for admin listing tables (Notícias,
 * Galerias, Vídeos, ...). PT is always considered complete for legacy/migrated
 * rows (no `_translations` from the API yet) so older content never shows a
 * false "pending" state. */
export function TranslationBadges({ translations }: { translations?: { pt: boolean; en: boolean } }) {
  const pt = translations?.pt ?? true;
  const en = translations?.en ?? false;
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span className={`inline-flex items-center gap-1 ${pt ? "text-foreground/70" : "text-foreground/30"}`} title="Português">
        <FlagPT className="h-2.5 w-3.5 rounded-[1px]" />
        {pt ? "✓" : "—"}
      </span>
      <span className={`inline-flex items-center gap-1 ${en ? "text-foreground/70" : "text-gold-600 dark:text-gold-400"}`} title="English">
        <FlagGB className="h-2.5 w-3.5 rounded-[1px]" />
        {en ? "✓" : "Pendente"}
      </span>
    </div>
  );
}
