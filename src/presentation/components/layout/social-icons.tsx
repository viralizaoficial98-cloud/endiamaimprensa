"use client";

import { motion } from "framer-motion";
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaTiktok, FaWhatsapp, FaXTwitter, FaYoutube } from "react-icons/fa6";
import type { SocialLink, SocialPlatform } from "@/domain/entities";
import { cn } from "@/lib/utils";

const PLATFORM_META: Record<SocialPlatform, { label: string; Icon: typeof FaFacebookF }> = {
  FACEBOOK: { label: "Facebook", Icon: FaFacebookF },
  INSTAGRAM: { label: "Instagram", Icon: FaInstagram },
  LINKEDIN: { label: "LinkedIn", Icon: FaLinkedinIn },
  YOUTUBE: { label: "YouTube", Icon: FaYoutube },
  TWITTER: { label: "X (Twitter)", Icon: FaXTwitter },
  TIKTOK: { label: "TikTok", Icon: FaTiktok },
  WHATSAPP: { label: "WhatsApp", Icon: FaWhatsapp },
};

export function SocialIcons({ links, tone = "dark", className }: { links: SocialLink[]; tone?: "dark" | "light"; className?: string }) {
  if (links.length === 0) return null;

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      {links.map((link) => {
        const meta = PLATFORM_META[link.platform];
        if (!meta) return null;
        return (
          <motion.a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={meta.label}
            whileHover={{ scale: 1.15, rotate: 8 }}
            whileTap={{ scale: 0.9 }}
            className={cn(
              "inline-flex size-9 items-center justify-center rounded-full border transition-colors hover:border-gold-400 hover:text-gold-400",
              tone === "dark" ? "border-white/15 text-white/70" : "border-border-subtle text-foreground/60"
            )}
          >
            <meta.Icon className="size-3.5" />
          </motion.a>
        );
      })}
    </div>
  );
}
