import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import { ThemeProvider } from "@/presentation/providers/theme-provider";
import { cn } from "@/lib/utils";
import "./globals.css";

const heading = Fraunces({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const body = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const SITE_URL = "https://imprensa.endiama.co.ao";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "ENDIAMA Notícias — Sala de Imprensa da ENDIAMA E.P.",
    template: "%s — ENDIAMA Notícias",
  },
  description:
    "Portal de notícias oficial da ENDIAMA E.P. — Empresa Nacional de Diamantes de Angola. Cobertura do sector mineiro, mercado diamantífero, sustentabilidade e responsabilidade social.",
  keywords: [
    "ENDIAMA",
    "diamantes",
    "Angola",
    "mineração",
    "SODIAM",
    "sector mineiro angolano",
    "notícias",
  ],
  authors: [{ name: "ENDIAMA E.P." }],
  openGraph: {
    type: "website",
    locale: "pt_AO",
    url: SITE_URL,
    siteName: "ENDIAMA Notícias",
    title: "ENDIAMA Notícias — Sala de Imprensa da ENDIAMA E.P.",
    description:
      "Portal de notícias oficial da ENDIAMA E.P. — cobertura do sector mineiro e diamantífero angolano.",
    images: [{ url: "/images/logotipo_endiama.png", width: 1200, height: 630, alt: "ENDIAMA" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ENDIAMA Notícias",
    description: "Portal de notícias oficial da ENDIAMA E.P.",
  },
  icons: {
    icon: "/images/logotipo_endiama.png",
  },
};

/**
 * Deliberately minimal: this is the ONE layout shared by every route (public
 * and admin alike), so it only renders what is truly global — the <html>/<body>
 * shell, fonts and theme. Public chrome (Header/Footer/...) lives in
 * app/(public)/layout.tsx and admin auth lives in app/admin/layout.tsx — never
 * here. A previous version branched on a request-header-derived pathname to
 * fake that split inside this single layout; that broke because Next.js reuses
 * a shared layout's already-rendered output across client-side navigations
 * instead of re-running it, so navigating from a public page to /admin/login
 * could keep the public branch mounted (and its now-missing AdminAuthProvider
 * would crash the login page into the nearest error boundary). Real route
 * segments — not a header check — are what make Next.js treat "public" and
 * "admin" as genuinely different branches to swap between.
 */
export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();

  return (
    <html lang={locale === "en" ? "en" : "pt-AO"} suppressHydrationWarning className={cn("h-full", "antialiased", heading.variable, body.variable, "font-sans")}>
      <body className="min-h-full bg-background text-foreground">
        <NextIntlClientProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
