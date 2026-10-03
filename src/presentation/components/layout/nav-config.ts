import type { useTranslations } from "next-intl";
import type { Category } from "@/domain/entities";

export interface NavLink {
  label: string;
  href: string;
}

type Translate = ReturnType<typeof useTranslations>;

/** Início, Notícias, Entrevistas, Eventos e Documentos têm de aparecer
 * primeiro e por esta ordem exacta — só depois seguem os restantes menus.
 * Labels come from the active-locale dictionary; hrefs stay untranslated
 * since routes are not locale-prefixed. */
export function getPrimaryNavLinks(t: Translate): NavLink[] {
  return [
    { label: t("nav.home"), href: "/" },
    { label: t("nav.news"), href: "/noticias" },
    { label: t("nav.interviews"), href: "/entrevistas" },
    { label: t("nav.events"), href: "/eventos" },
    { label: t("nav.documents"), href: "/documentos" },
    { label: t("nav.videos"), href: "/videos" },
    { label: t("nav.gallery"), href: "/galeria" },
    { label: t("nav.audios"), href: "/audios" },
    { label: t("nav.clipping"), href: "/clipping" },
    { label: t("nav.contact"), href: "/contacto" },
  ];
}

export function buildMegaMenuCategories(categories: Category[]) {
  return categories.map((category) => ({
    label: category.name,
    href: `/categoria/${category.slug}`,
    description: category.description,
  }));
}
