"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { HiArrowRight, HiOutlineMicrophone, HiOutlineVideoCamera } from "react-icons/hi2";
import type { Category, Interview } from "@/domain/entities";
import { formatDate } from "@/lib/format";
import { fadeUp } from "@/presentation/animations/variants";
import { RevealGroup, RevealItem } from "@/presentation/components/ui/reveal";

const MAIN_COUNT = 1;
const SECONDARY_COUNT = 3;

export function InterviewsExplorer({
  interviews,
  categories,
  priority = false,
}: {
  interviews: Interview[];
  categories: Category[];
  /** Only the /entrevistas listing page has this as its LCP element — on the
   * homepage it's several sections below the fold, so it must stay lazy there
   * instead of competing with the Hero image for initial bandwidth. */
  priority?: boolean;
}) {
  const [activeCategory, setActiveCategory] = useState<string>("todas");

  const filtered = useMemo(
    () => (activeCategory === "todas" ? interviews : interviews.filter((item) => item.category.slug === activeCategory)),
    [interviews, activeCategory]
  );

  const main = filtered[0];
  const secondary = filtered.slice(MAIN_COUNT, MAIN_COUNT + SECONDARY_COUNT);
  const recent = filtered.slice(MAIN_COUNT + SECONDARY_COUNT);

  return (
    <div>
      <div className="scrollbar-hide -mx-1 mb-8 flex gap-2 overflow-x-auto px-1 pb-2">
        <FilterPill active={activeCategory === "todas"} onClick={() => setActiveCategory("todas")} label="Todas" />
        {categories.map((category) => (
          <FilterPill
            key={category.id}
            active={activeCategory === category.slug}
            onClick={() => setActiveCategory(category.slug)}
            label={category.name}
          />
        ))}
      </div>

      {!main ? (
        <p className="py-16 text-center text-sm text-foreground/50">Ainda não existem entrevistas publicadas nesta categoria.</p>
      ) : (
        <>
          <RevealGroup className="grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_1fr]" stagger={0.12}>
            <RevealItem variants={fadeUp}>
              <MainInterview interview={main} priority={priority} />
            </RevealItem>
            <RevealItem variants={fadeUp} className="grid grid-cols-1 gap-5 sm:grid-cols-3 lg:grid-cols-1">
              {secondary.map((interview) => (
                <SecondaryInterview key={interview.id} interview={interview} />
              ))}
            </RevealItem>
          </RevealGroup>

          {recent.length > 0 ? (
            <RevealGroup className="mt-10 divide-y divide-border-subtle/60" stagger={0.06}>
              {recent.map((interview) => (
                <RevealItem key={interview.id} variants={fadeUp}>
                  <RecentInterviewRow interview={interview} />
                </RevealItem>
              ))}
            </RevealGroup>
          ) : null}
        </>
      )}
    </div>
  );
}

function MainInterview({ interview, priority }: { interview: Interview; priority?: boolean }) {
  return (
    <article className="group relative flex min-h-[420px] flex-col justify-end overflow-hidden rounded-3xl bg-brand-900 shadow-[0_1px_2px_rgba(15,42,30,0.06),0_16px_40px_-24px_rgba(15,42,30,0.35)]">
      <Link href={`/entrevistas/${interview.slug}`} className="absolute inset-0 z-10" aria-label={interview.title} />
      <Image
        src={interview.intervieweePhoto}
        alt={interview.intervieweeName}
        fill
        priority={priority}
        fetchPriority={priority ? "high" : undefined}
        sizes="(max-width: 1024px) 100vw, 55vw"
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/0" />
      <div className="relative z-20 flex flex-col gap-3 p-7 sm:p-9">
        <div className="flex items-center gap-2">
          <span className="inline-flex w-fit items-center rounded-full bg-gold-500 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-brand-900">
            {interview.category.name}
          </span>
          {interview.videoUrl ? <HiOutlineVideoCamera className="size-4 text-white/70" aria-label="Com vídeo" /> : null}
          {interview.audioUrl ? <HiOutlineMicrophone className="size-4 text-white/70" aria-label="Com áudio" /> : null}
        </div>
        <h3 className="max-w-xl font-heading text-2xl font-medium leading-tight text-white sm:text-3xl">{interview.title}</h3>
        <p className="max-w-lg text-sm leading-relaxed text-white/70 sm:line-clamp-2">{interview.excerpt}</p>
        <div className="mt-1 text-sm text-white/85">
          <span className="font-semibold">{interview.intervieweeName}</span>
          {interview.intervieweeRole ? <span className="text-white/60"> · {interview.intervieweeRole}</span> : null}
          {interview.intervieweeCompany ? <span className="text-white/60"> · {interview.intervieweeCompany}</span> : null}
        </div>
        <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-gold-300">
          Ler entrevista
          <HiArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
        </div>
      </div>
    </article>
  );
}

function SecondaryInterview({ interview }: { interview: Interview }) {
  return (
    <article className="group relative flex items-center gap-4 overflow-hidden rounded-2xl bg-surface p-3 shadow-[0_1px_2px_rgba(15,42,30,0.05)] transition-shadow duration-300 hover:shadow-[0_8px_20px_-14px_rgba(15,42,30,0.35)] sm:flex-col sm:items-stretch sm:p-0 lg:flex-row lg:items-center lg:p-3">
      <Link href={`/entrevistas/${interview.slug}`} className="absolute inset-0 z-10" aria-label={interview.title} />
      <div className="relative size-16 shrink-0 overflow-hidden rounded-xl sm:size-full sm:aspect-[4/3] sm:rounded-2xl lg:size-16 lg:rounded-xl">
        <Image
          src={interview.intervieweePhoto}
          alt={interview.intervieweeName}
          fill
          sizes="128px"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
        />
      </div>
      <div className="relative z-20 min-w-0 flex-1 sm:p-4 lg:p-0">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">
          {interview.category.name}
        </span>
        <h4 className="mt-1 line-clamp-2 font-heading text-sm font-medium leading-snug text-foreground transition-colors group-hover:text-brand-600 dark:group-hover:text-brand-400">
          {interview.title}
        </h4>
        <p className="mt-1 truncate text-xs text-foreground/50">
          {interview.intervieweeName}
          {interview.intervieweeRole ? ` · ${interview.intervieweeRole}` : ""}
        </p>
      </div>
    </article>
  );
}

function RecentInterviewRow({ interview }: { interview: Interview }) {
  return (
    <motion.div className="group relative flex items-center gap-4 py-4">
      <Link href={`/entrevistas/${interview.slug}`} className="absolute inset-0 z-10" aria-label={interview.title} />
      <div className="relative z-20 size-12 shrink-0 overflow-hidden rounded-full">
        <Image src={interview.intervieweePhoto} alt={interview.intervieweeName} fill sizes="48px" className="object-cover" />
      </div>
      <div className="relative z-20 min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground/85">{interview.intervieweeName}</p>
        <h4 className="truncate font-heading text-sm text-foreground/60 transition-colors group-hover:text-brand-600 dark:group-hover:text-brand-400">
          {interview.title}
        </h4>
      </div>
      <span className="hidden shrink-0 text-xs text-foreground/40 sm:block">{formatDate(interview.publishedAt)}</span>
      <HiArrowRight className="relative z-20 size-4 shrink-0 text-foreground/30 transition-all duration-300 group-hover:translate-x-1 group-hover:text-brand-600 dark:group-hover:text-brand-400" />
    </motion.div>
  );
}

function FilterPill({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
        active ? "bg-brand-600 text-white" : "bg-surface-muted text-foreground/60 hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}
