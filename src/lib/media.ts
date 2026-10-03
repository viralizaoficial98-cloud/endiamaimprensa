const DEFAULT_FALLBACK = "/images/fallbacks/mining-news-default.webp";

/** Category slug -> editorial fallback photograph. Never the ENDIAMA logo. */
const CATEGORY_FALLBACKS: Record<string, string> = {
  "operacoes-mineiras": "/images/fallbacks/mining-news-default.webp",
  sustentabilidade: "/images/fallbacks/mining-news-default.webp",
  institucional: "/images/fallbacks/mining-news-default.webp",
  "grupo-endiama": "/images/fallbacks/diamonds-default.webp",
  comercializacao: "/images/fallbacks/diamonds-default.webp",
  lapidacao: "/images/fallbacks/diamonds-default.webp",
  diamante: "/images/fallbacks/diamonds-default.webp",
  ouro: "/images/fallbacks/diamonds-default.webp",
  "responsabilidade-social": "/images/fallbacks/social-default.webp",
  cultura: "/images/fallbacks/social-default.webp",
  desporto: "/images/fallbacks/social-default.webp",
  multimedia: "/images/fallbacks/technology-default.webp",
  tecnologia: "/images/fallbacks/technology-default.webp",
  internacional: "/images/fallbacks/economy-default.webp",
};

/** Resolves any image path stored on an entity into a usable, absolute-when-needed URL, with an editorial fallback for missing/invalid values. */
export function resolveMediaUrl(path?: string | null, fallback: string = DEFAULT_FALLBACK): string {
  if (!path || path.trim() === "") {
    return fallback;
  }
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  if (path.startsWith("/uploads")) {
    return `${process.env.NEXT_PUBLIC_BACKEND_URL ?? ""}${path}`;
  }
  if (path.startsWith("/")) {
    return path;
  }
  return `/${path}`;
}

/** Editorial fallback photograph for a given category slug (never the ENDIAMA logo). */
export function getCategoryFallback(categorySlug?: string | null): string {
  if (!categorySlug) return DEFAULT_FALLBACK;
  return CATEGORY_FALLBACKS[categorySlug] ?? DEFAULT_FALLBACK;
}

export const INTERVIEW_PROFILE_FALLBACK = "/images/fallbacks/interview-profile-default.webp";
