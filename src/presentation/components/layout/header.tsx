"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { HiBars3, HiChevronDown, HiOutlineMagnifyingGlass, HiOutlineShieldCheck, HiXMark } from "react-icons/hi2";
import type { Category, SocialLink } from "@/domain/entities";
import { cn } from "@/lib/utils";
import { SearchModal } from "@/presentation/components/search/search-modal";
import { SocialIcons } from "./social-icons";
import { buildMegaMenuCategories, getPrimaryNavLinks } from "./nav-config";
import { LanguageSwitcher } from "./language-switcher";
import { ThemeToggle } from "./theme-toggle";

export function Header({ categories, socialLinks }: { categories: Category[]; socialLinks: SocialLink[] }) {
  const megaMenuCategories = buildMegaMenuCategories(categories);
  const [scrolled, setScrolled] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();
  const t = useTranslations();
  const locale = useLocale();
  const primaryNavLinks = getPrimaryNavLinks(t);
  const todayLabel = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "pt-AO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Luanda",
  }).format(new Date());

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 40);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setMegaOpen(false);
  }, [pathname]);

  const hasDarkHero = pathname === "/" || pathname.startsWith("/noticia/") || pathname.startsWith("/categoria/");
  const solid = scrolled || mobileOpen || !hasDarkHero;

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-300",
          solid ? "glass shadow-sm" : "bg-transparent"
        )}
      >
        {/* Camada 1 — barra institucional */}
        <div
          className={cn(
            "hidden items-center justify-between px-5 py-1.5 text-[11px] backdrop-blur-sm transition-colors duration-300 sm:flex lg:px-12",
            solid ? "bg-surface-muted/60 text-foreground/50" : "bg-black/10 text-white/60"
          )}
        >
          <div className="flex items-center gap-4">
            <span className="font-medium uppercase tracking-[0.08em]">ENDIAMA E.P. | PORTAL DE NOTÍCIAS</span>
            <span className="hidden md:inline">{todayLabel}</span>
          </div>
          <div className="flex items-center gap-5">
            <SocialIcons links={socialLinks} tone={solid ? "light" : "dark"} />
            <Link
              href="/admin/login"
              className="group relative inline-flex items-center gap-1.5 py-1 transition-colors hover:text-brand-600 dark:hover:text-brand-400"
            >
              <HiOutlineShieldCheck className="size-3.5" />
              {t("nav.adminArea")}
              <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-current transition-all duration-300 group-hover:w-full" />
            </Link>
          </div>
        </div>

        {/* Camada 2 — navegação principal */}
        <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <Link href="/" className="group relative flex items-center gap-3">
            <div className="relative h-10 w-36 sm:h-11 sm:w-40">
              <Image
                src="/images/logotipo_endiama.png"
                alt="ENDIAMA - Empresa Nacional de Diamantes de Angola"
                fill
                sizes="160px"
                className={cn("object-contain object-left transition-all duration-500", !solid && "brightness-0 invert")}
              />
            </div>
          </Link>

          <nav className="hidden items-center gap-5 xl:flex xl:gap-6">
            {primaryNavLinks.map((link) => {
              const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "group relative py-2 text-sm font-medium transition-colors",
                    solid ? "text-foreground/80 hover:text-brand-600" : "text-white/90 hover:text-white"
                  )}
                >
                  {link.label}
                  <span
                    className={cn(
                      "absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-current transition-transform duration-300 group-hover:scale-x-100",
                      active && "scale-x-100"
                    )}
                  />
                </Link>
              );
            })}

            <div className="relative" onMouseEnter={() => setMegaOpen(true)} onMouseLeave={() => setMegaOpen(false)}>
              <button
                type="button"
                className={cn(
                  "group relative flex items-center gap-1 py-2 text-sm font-medium transition-colors",
                  solid ? "text-foreground/80 hover:text-brand-600" : "text-white/90 hover:text-white"
                )}
              >
                {t("nav.categories")}
                <span
                  className={cn(
                    "absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-current transition-transform duration-300 group-hover:scale-x-100",
                    megaOpen && "scale-x-100"
                  )}
                />
              </button>

              <AnimatePresence>
                {megaOpen ? (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 12 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="glass absolute left-1/2 top-full mt-3 w-[560px] -translate-x-1/2 rounded-2xl border border-border-subtle p-6 shadow-2xl"
                  >
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                      {megaMenuCategories.map((category) => (
                        <Link
                          key={category.href}
                          href={category.href}
                          className="group/item rounded-xl p-2 transition-colors hover:bg-brand-600/5"
                        >
                          <p className="font-heading text-sm font-medium text-foreground transition-colors group-hover/item:text-brand-600 dark:group-hover/item:text-brand-400">
                            {category.label}
                          </p>
                          <p className="mt-1 line-clamp-1 text-xs text-foreground/50">{category.description}</p>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              aria-label={t("search.ariaLabel")}
              onClick={() => setSearchOpen(true)}
              className={cn(
                "inline-flex size-9 items-center justify-center rounded-full border transition-colors",
                solid
                  ? "border-border-subtle text-foreground/70 hover:border-brand-500 hover:text-brand-600"
                  : "border-white/30 text-white hover:border-white hover:bg-white/10"
              )}
            >
              <HiOutlineMagnifyingGlass className="size-4" />
            </button>
            <div className={solid ? "" : "[&_button]:border-white/30 [&_button]:text-white [&_button:hover]:border-white"}>
              <ThemeToggle />
            </div>
            <LanguageSwitcher tone={solid ? "auto" : "light"} />
            <button
              type="button"
              aria-label={t("nav.openMenu")}
              onClick={() => setMobileOpen(true)}
              className={cn(
                "inline-flex size-9 items-center justify-center rounded-full border transition-colors xl:hidden",
                solid ? "border-border-subtle text-foreground/70" : "border-white/30 text-white"
              )}
            >
              <HiBars3 className="size-5" />
            </button>
          </div>
        </div>
      </header>

      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} megaMenuCategories={megaMenuCategories} socialLinks={socialLinks} />
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

function MobileMenu({
  open,
  onClose,
  megaMenuCategories,
  socialLinks,
}: {
  open: boolean;
  onClose: () => void;
  megaMenuCategories: ReturnType<typeof buildMegaMenuCategories>;
  socialLinks: SocialLink[];
}) {
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const t = useTranslations();
  const primaryNavLinks = getPrimaryNavLinks(t);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/50"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-y-0 right-0 z-[70] flex w-[85%] max-w-sm flex-col overflow-y-auto bg-surface p-6 shadow-2xl"
          >
            <div className="mb-8 flex items-center justify-between">
              <span className="font-heading text-lg font-medium">{t("nav.menu")}</span>
              <div className="flex items-center gap-3">
                <LanguageSwitcher />
                <button
                  type="button"
                  aria-label={t("nav.closeMenu")}
                  onClick={onClose}
                  className="inline-flex size-9 items-center justify-center rounded-full border border-border-subtle"
                >
                  <HiXMark className="size-5" />
                </button>
              </div>
            </div>
            <nav className="flex flex-col gap-1">
              {primaryNavLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-lg px-3 py-3 text-base font-medium text-foreground/80 transition-colors hover:bg-brand-600/5 hover:text-brand-600"
                >
                  {link.label}
                </Link>
              ))}
              <button
                type="button"
                onClick={() => setCategoriesOpen((v) => !v)}
                aria-expanded={categoriesOpen}
                className="flex items-center justify-between rounded-lg px-3 py-3 text-base font-medium text-foreground/80 transition-colors hover:bg-brand-600/5 hover:text-brand-600"
              >
                {t("nav.categories")}
                <HiChevronDown className={cn("size-4 transition-transform duration-300", categoriesOpen && "rotate-180")} />
              </button>
              <AnimatePresence initial={false}>
                {categoriesOpen ? (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="overflow-hidden pl-3"
                  >
                    <div className="flex flex-col gap-1 py-1">
                      {megaMenuCategories.map((category) => (
                        <Link
                          key={category.href}
                          href={category.href}
                          className="rounded-lg px-3 py-2 text-sm text-foreground/70 transition-colors hover:bg-brand-600/5 hover:text-brand-600"
                        >
                          {category.label}
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </nav>
            <div className="mt-6 flex flex-col gap-4 border-t border-border-subtle pt-6">
              <div className="flex items-center justify-between">
                <SocialIcons links={socialLinks} tone="light" />
                <ThemeToggle />
              </div>
              <Link
                href="/admin/login"
                onClick={onClose}
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground/70 transition-colors hover:bg-brand-600/5 hover:text-brand-600"
              >
                <HiOutlineShieldCheck className="size-4" />
                {t("nav.adminArea")}
              </Link>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
