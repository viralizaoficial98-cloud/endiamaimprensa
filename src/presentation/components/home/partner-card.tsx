import Image from "next/image";
import type { Partner } from "@/domain/entities";
import { cn } from "@/lib/utils";

/** Deterministic pastel-on-brand background for the initials placeholder, so
 * different partners without a logo are still visually distinguishable. */
const PLACEHOLDER_PALETTES = [
  "from-brand-600 to-brand-800",
  "from-gold-500 to-gold-700",
  "from-brand-700 to-brand-950",
  "from-brand-500 to-brand-700",
];

function paletteFor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return PLACEHOLDER_PALETTES[hash % PLACEHOLDER_PALETTES.length];
}

export function PartnerCard({ partner }: { partner: Partner }) {
  const hasLink = Boolean(partner.url) && partner.url !== "#";
  const Wrapper = hasLink ? "a" : "div";

  return (
    <Wrapper
      {...(hasLink ? { href: partner.url, target: "_blank", rel: "noopener noreferrer", title: partner.name } : {})}
      className={cn(
        "group flex w-full flex-col items-center gap-4 rounded-2xl border border-border-subtle bg-surface p-6 text-center transition-all duration-300",
        "hover:-translate-y-1 hover:border-brand-500 hover:shadow-lg",
        hasLink ? "cursor-pointer" : "cursor-default"
      )}
    >
      <div className="relative flex h-16 w-full items-center justify-center overflow-hidden">
        {partner.logoUrl ? (
          <Image
            src={partner.logoUrl}
            alt={partner.name}
            width={160}
            height={64}
            sizes="160px"
            className="max-h-16 w-auto object-contain grayscale transition-all duration-300 group-hover:grayscale-0"
          />
        ) : (
          <span
            className={cn(
              "flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br px-1.5 text-center font-heading font-semibold text-white shadow-sm transition-transform duration-300 group-hover:scale-105",
              partner.initials.length > 5 ? "text-[10px] leading-tight tracking-tight" : "text-sm tracking-wide",
              paletteFor(partner.id)
            )}
          >
            {partner.initials}
          </span>
        )}
      </div>
      <span className="line-clamp-2 text-xs font-medium text-foreground/70 transition-colors group-hover:text-brand-700 dark:group-hover:text-brand-400">
        {partner.name}
      </span>
    </Wrapper>
  );
}
