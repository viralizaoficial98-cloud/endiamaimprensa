import type { Request } from "express";

export type Locale = "pt" | "en";

export function resolveLocale(req: Request): Locale {
  return req.query.locale === "en" ? "en" : "pt";
}

function isFilled(value: unknown): boolean {
  return value !== null && value !== undefined && value !== "";
}

/** Public-facing content resolution: given a raw Prisma record and a list of
 * [ptField, enField] pairs, returns a NEW object (never mutates the input)
 * where each ptField's value is swapped for its enField counterpart when
 * locale is "en" AND that translation is actually filled in — otherwise the
 * original Portuguese value is kept as a safe fallback (never a broken page).
 * The *En keys are stripped from the response; consumers only ever see the
 * base field name, so DTOs/mappers/components never need to know about
 * translations at all. */
export function localize<T extends object>(entity: T, locale: Locale, fieldPairs: [string, string][]): T {
  const result = { ...entity } as Record<string, unknown>;
  for (const [ptField, enField] of fieldPairs) {
    if (locale === "en" && isFilled(result[enField])) {
      result[ptField] = result[enField];
    }
    delete result[enField];
  }
  return result as T;
}

/** Admin-only: reports whether the CORE fields of each language are filled
 * in, for the "PT ✓ / EN Pendente" list indicator. Callers pass only the
 * field pairs that are actually required for that content type in Portuguese
 * (e.g. title+excerpt+content for News) — optional bonus fields (subtitle,
 * alt text, ...) are translatable but don't gate the indicator. */
export function translationStatus(entity: object, coreFieldPairs: [string, string][]): { pt: boolean; en: boolean } {
  const record = entity as Record<string, unknown>;
  return {
    pt: coreFieldPairs.every(([ptField]) => isFilled(record[ptField])),
    en: coreFieldPairs.every(([, enField]) => isFilled(record[enField])),
  };
}
