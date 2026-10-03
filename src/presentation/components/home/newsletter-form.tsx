"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { HiOutlineCheckCircle, HiOutlinePaperAirplane } from "react-icons/hi2";
import { subscribeToNewsletter } from "@/application/use-cases/newsletter-use-cases";
import { cn } from "@/lib/utils";

export function NewsletterForm({ compact = false }: { compact?: boolean }) {
  const t = useTranslations("newsletter");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || status === "submitting") return;
    setStatus("submitting");
    try {
      await subscribeToNewsletter(email.trim());
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "flex items-center gap-2 rounded-full border border-brand-500/40 bg-brand-500/10 px-4 py-2.5 text-sm text-brand-300",
          compact ? "text-xs" : ""
        )}
      >
        <HiOutlineCheckCircle className="size-4 shrink-0" />
        {t("success")}
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={cn("flex flex-col gap-2", compact ? "" : "")}>
      <div className={cn("flex items-center gap-2", compact ? "flex-col sm:flex-row" : "")}>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("emailPlaceholder")}
          className={cn(
            "w-full rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/40 outline-none transition-colors focus:border-gold-400",
            compact ? "text-xs" : "text-sm"
          )}
        />
        <motion.button
          type="submit"
          disabled={status === "submitting"}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-gold-500 px-5 py-2.5 text-sm font-semibold text-brand-950 transition-colors hover:bg-gold-400 disabled:opacity-50"
        >
          {t("subscribe")}
          <HiOutlinePaperAirplane className="size-3.5" />
        </motion.button>
      </div>
      {status === "error" ? <p className="text-xs text-red-400">{t("error")}</p> : null}
    </form>
  );
}
