"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export function CategoryBadge({
  name,
  slug,
  className,
  size = "sm",
}: {
  name: string;
  slug: string;
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <Link
      href={`/categoria/${slug}`}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "inline-flex items-center rounded-full bg-brand-600 font-semibold uppercase tracking-wide text-white transition-colors hover:bg-brand-700",
        size === "sm" ? "px-2.5 py-1 text-[11px]" : "px-3.5 py-1.5 text-xs",
        className
      )}
    >
      {name}
    </Link>
  );
}
