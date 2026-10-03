import Link from "next/link";
import { HiArrowRight } from "react-icons/hi2";
import { Reveal } from "./reveal";

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  href?: string;
  hrefLabel?: string;
}

export function SectionHeader({ eyebrow, title, description, href, hrefLabel = "Ver tudo" }: SectionHeaderProps) {
  return (
    <Reveal className="mb-10 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
      <div>
        {eyebrow ? (
          <span className="mb-3 inline-block text-xs font-semibold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400">
            {eyebrow}
          </span>
        ) : null}
        <h2 className="font-heading text-3xl font-medium tracking-tight text-foreground sm:text-4xl">{title}</h2>
        {description ? (
          <p className="mt-3 max-w-2xl text-base text-foreground/60">{description}</p>
        ) : null}
      </div>
      {href ? (
        <Link
          href={href}
          className="group inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-foreground transition-colors hover:text-brand-600 dark:hover:text-brand-400"
        >
          <span className="relative">
            {hrefLabel}
            <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-current transition-all duration-300 group-hover:w-full" />
          </span>
          <HiArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      ) : null}
    </Reveal>
  );
}
