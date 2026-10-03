"use client";

import { motion } from "framer-motion";
import { HiOutlineArrowDownTray, HiOutlineDocumentText } from "react-icons/hi2";
import type { EndiamaDocument } from "@/domain/entities";
import { formatDate, formatFileSize } from "@/lib/format";
import { fadeUp } from "@/presentation/animations/variants";

export function DocumentCard({ document, animated = true }: { document: EndiamaDocument; animated?: boolean }) {
  return (
    <motion.a
      href={document.downloadUrl}
      variants={animated ? fadeUp : undefined}
      className="group flex items-center gap-4 rounded-2xl border border-border-subtle bg-surface p-5 transition-all hover:-translate-y-1 hover:border-brand-500/40 hover:shadow-lg"
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-600/10 text-brand-600 dark:text-brand-400">
        <HiOutlineDocumentText className="size-6" />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-1 font-heading text-sm font-medium text-foreground">{document.title}</h3>
        <p className="mt-1 line-clamp-1 text-xs text-foreground/50">{document.description}</p>
        <p className="mt-1.5 text-[11px] text-foreground/40">
          {document.fileType} · {formatFileSize(document.fileSizeKB)} · {formatDate(document.publishedAt)}
        </p>
      </div>
      <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-foreground/40 transition-all group-hover:translate-y-0.5 group-hover:text-brand-600">
        <HiOutlineArrowDownTray className="size-4" />
      </span>
    </motion.a>
  );
}
