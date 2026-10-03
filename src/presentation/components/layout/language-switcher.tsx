"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setLocale } from "@/i18n/actions";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";
import { FlagGB, FlagPT } from "./flag-icons";

/** The two flags stay visible side by side at all times (never a dropdown) —
 * the active one gets a discreet underline/ring, matching how ThemeToggle
 * keeps its footprint small next to it. */
export function LanguageSwitcher({ tone = "auto" }: { tone?: "auto" | "light" }) {
  const locale = useLocale();
  const t = useTranslations("language");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSelect(next: Locale) {
    if (next === locale || isPending) return;
    startTransition(async () => {
      await setLocale(next);
      router.refresh();
    });
  }

  return (
    <div className={cn("flex items-center gap-1 rounded-full border px-1 py-1", tone === "light" ? "border-white/30" : "border-border-subtle")}>
      <LanguageButton active={locale === "pt"} label={t("portuguese")} tone={tone} onClick={() => handleSelect("pt")}>
        <FlagPT className="h-3 w-4 rounded-[2px]" />
      </LanguageButton>
      <LanguageButton active={locale === "en"} label={t("english")} tone={tone} onClick={() => handleSelect("en")}>
        <FlagGB className="h-3 w-4 rounded-[2px]" />
      </LanguageButton>
    </div>
  );
}

function LanguageButton({
  active,
  label,
  tone,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  tone: "auto" | "light";
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      title={label}
      onClick={onClick}
      className={cn(
        "group relative inline-flex items-center justify-center rounded-full p-1 transition-opacity",
        active ? "opacity-100" : "opacity-45 hover:opacity-80"
      )}
    >
      {children}
      <span
        className={cn(
          "absolute -bottom-0.5 left-1/2 h-0.5 w-3 -translate-x-1/2 rounded-full transition-opacity",
          active ? (tone === "light" ? "bg-white opacity-100" : "bg-gold-500 opacity-100") : "opacity-0"
        )}
      />
    </button>
  );
}
