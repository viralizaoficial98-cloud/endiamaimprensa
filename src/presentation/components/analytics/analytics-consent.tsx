"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import Script from "next/script";
import { useEffect, useState } from "react";

/**
 * Google Analytics 4 — prepared but OFF by default. Nothing is loaded and no
 * banner is shown unless NEXT_PUBLIC_GA_MEASUREMENT_ID is set at build time.
 * When it is set, the gtag script is only injected after the visitor
 * explicitly accepts; refusing (or never answering) means no request is ever
 * made to Google. The choice is remembered in localStorage only.
 *
 * Before enabling it in production the Privacy Policy must be updated — it
 * currently states that no tracking cookies are used.
 */
const MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
const CONSENT_KEY = "endiama-analytics-consent";

type Consent = "granted" | "denied" | null;

function readConsent(): Consent {
  try {
    const value = window.localStorage.getItem(CONSENT_KEY);
    return value === "granted" || value === "denied" ? value : null;
  } catch {
    return null;
  }
}

function saveConsent(value: Exclude<Consent, null>) {
  try {
    window.localStorage.setItem(CONSENT_KEY, value);
  } catch {
    // Private mode / blocked storage: the choice simply lasts for this page view.
  }
}

export function AnalyticsConsent() {
  const t = useTranslations("consent");
  const [consent, setConsent] = useState<Consent>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setConsent(readConsent());
    setReady(true);
  }, []);

  if (!MEASUREMENT_ID || !ready) return null;

  function choose(value: Exclude<Consent, null>) {
    saveConsent(value);
    setConsent(value);
  }

  return (
    <>
      {consent === "granted" ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(MEASUREMENT_ID)}`} strategy="afterInteractive" />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config',${JSON.stringify(MEASUREMENT_ID)},{anonymize_ip:true});`}
          </Script>
        </>
      ) : null}

      {consent === null ? (
        <div
          role="dialog"
          aria-live="polite"
          aria-label={t("title")}
          className="fixed inset-x-4 bottom-4 z-[60] mx-auto max-w-xl rounded-2xl border border-foreground/10 bg-background/95 p-5 text-sm shadow-2xl backdrop-blur sm:inset-x-6"
        >
          <p className="font-heading text-base font-medium text-foreground">{t("title")}</p>
          <p className="mt-2 text-foreground/70">
            {t("message")}{" "}
            <Link href="/politica-de-privacidade" className="text-brand-600 underline-offset-2 hover:underline dark:text-brand-400">
              {t("privacyLink")}
            </Link>
          </p>
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => choose("denied")}
              className="min-h-11 rounded-full border border-foreground/15 px-5 font-semibold text-foreground transition-colors hover:bg-foreground/5"
            >
              {t("reject")}
            </button>
            <button
              type="button"
              onClick={() => choose("granted")}
              className="min-h-11 rounded-full bg-brand-600 px-5 font-semibold text-white transition-colors hover:bg-brand-700"
            >
              {t("accept")}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
