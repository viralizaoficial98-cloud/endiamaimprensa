import { getLocale, getTranslations } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";
import {
  HiOutlineEnvelope,
  HiOutlineMapPin,
  HiOutlinePhone,
} from "react-icons/hi2";
import { getAllCategories } from "@/application/use-cases/category-use-cases";
import { getLatestNews } from "@/application/use-cases/news-use-cases";
import { getSocialLinks } from "@/application/use-cases/social-link-use-cases";
import { Container } from "@/presentation/components/ui/container";
import { SocialIcons } from "./social-icons";
import { NewsletterForm } from "@/presentation/components/home/newsletter-form";

export async function Footer() {
  const locale = await getLocale();
  const [latest, categories, socialLinks, t] = await Promise.all([
    getLatestNews(4, undefined, locale).catch(() => []),
    getAllCategories(locale).catch(() => []),
    getSocialLinks().catch(() => []),
    getTranslations(),
  ]);

  const quickLinks = [
    { label: t("nav.home"), href: "/" },
    { label: t("nav.news"), href: "/noticias" },
    { label: t("nav.videos"), href: "/videos" },
    { label: t("nav.gallery"), href: "/galeria" },
    { label: t("nav.interviews"), href: "/entrevistas" },
    { label: t("nav.events"), href: "/eventos" },
    { label: t("nav.documents"), href: "/documentos" },
    { label: t("nav.clipping"), href: "/clipping" },
    { label: t("nav.contact"), href: "/contacto" },
  ];

  const institutionalLinks = [
    { label: t("footer.aboutEndiama"), href: "/categoria/institucional" },
    { label: t("footer.endiamaGroup"), href: "/categoria/grupo-endiama" },
    { label: t("footer.sustainability"), href: "/categoria/sustentabilidade" },
    { label: t("footer.socialResponsibility"), href: "/categoria/responsabilidade-social" },
    { label: t("footer.privacyPolicy"), href: "/politica-de-privacidade" },
    { label: t("footer.termsOfUse"), href: "/termos-de-utilizacao" },
  ];

  return (
    <footer className="relative overflow-hidden border-t border-border-subtle bg-brand-700 text-white">
      <div className="pointer-events-none absolute -right-32 -top-32 size-96 rounded-full bg-brand-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -left-24 bottom-0 size-72 rounded-full bg-gold-500/15 blur-3xl" />

      <Container className="relative py-16 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <div className="relative h-11 w-44">
              <Image
                src="/images/logotipo_endiama.png"
                alt="ENDIAMA"
                fill
                sizes="176px"
                className="object-contain object-left brightness-0 invert"
              />
            </div>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/60">{t("footer.tagline")}</p>
            <SocialIcons links={socialLinks} tone="dark" className="mt-6" />
          </div>

          <div>
            <h4 className="font-heading text-sm font-semibold uppercase tracking-wide text-gold-400">{t("footer.quickLinks")}</h4>
            <ul className="mt-5 space-y-3 text-sm text-white/70">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <FooterLink href={link.href}>{link.label}</FooterLink>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-heading text-sm font-semibold uppercase tracking-wide text-gold-400">{t("footer.institutional")}</h4>
            <ul className="mt-5 space-y-3 text-sm text-white/70">
              {institutionalLinks.map((link) => (
                <li key={link.label}>
                  <FooterLink href={link.href}>{link.label}</FooterLink>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-heading text-sm font-semibold uppercase tracking-wide text-gold-400">{t("footer.newsletterTitle")}</h4>
            <p className="mt-5 text-sm text-white/60">{t("footer.newsletterText")}</p>
            <div className="mt-4">
              <NewsletterForm compact />
            </div>
            <div className="mt-6 space-y-3 text-sm text-white/70">
              <p className="flex items-center gap-2">
                <HiOutlineMapPin className="size-4 shrink-0 text-gold-400" /> Rua Rainha Ginga, Luanda, Angola
              </p>
              <p className="flex items-center gap-2">
                <HiOutlinePhone className="size-4 shrink-0 text-gold-400" /> +244 222 000 000
              </p>
              <p className="flex items-center gap-2">
                <HiOutlineEnvelope className="size-4 shrink-0 text-gold-400" /> imprensa@endiama.co.ao
              </p>
            </div>
          </div>
        </div>

        <div className="mt-14 border-t border-white/10 pt-10">
          <h4 className="font-heading text-sm font-semibold uppercase tracking-wide text-gold-400">{t("footer.latestNews")}</h4>
          <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {latest.map((news) => (
              <Link key={news.id} href={`/noticia/${news.slug}`} className="group">
                <p className="text-xs uppercase tracking-wide text-brand-300">{news.category.name}</p>
                <p className="mt-2 line-clamp-2 text-sm font-medium text-white/85 transition-colors group-hover:text-gold-400">
                  {news.title}
                </p>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6">
          <p className="mb-3 text-xs uppercase tracking-wide text-white/40">{t("footer.categories")}</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {categories.map((category) => (
              <FooterLink key={category.id} href={`/categoria/${category.slug}`} className="text-xs">
                {category.name}
              </FooterLink>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-xs text-white/40 sm:flex-row">
          <p>© {new Date().getFullYear()} ENDIAMA E.P. — Empresa Nacional de Diamantes de Angola. {t("footer.rightsReserved")}</p>
          <p>{t("footer.premiumPortal")}</p>
        </div>
      </Container>
    </footer>
  );
}

function FooterLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link href={href} className={`group relative inline-block w-fit transition-colors hover:text-gold-400 ${className ?? ""}`}>
      {children}
      <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-gold-400 transition-all duration-300 group-hover:w-full" />
    </Link>
  );
}
