"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  HiOutlineArrowUpRight,
  HiOutlineCalendarDays,
  HiOutlineClock,
  HiOutlineMapPin,
  HiOutlineUserGroup,
} from "react-icons/hi2";
import type { EndiamaEvent } from "@/domain/entities";
import { EVENT_STATUS_LABEL, EVENT_STATUS_STYLE } from "@/lib/event-status";
import { fadeUp } from "@/presentation/animations/variants";
import { Container } from "@/presentation/components/ui/container";
import { Reveal, RevealGroup } from "@/presentation/components/ui/reveal";
import { SectionHeader } from "@/presentation/components/ui/section-header";

const MONTH_FORMATTER = new Intl.DateTimeFormat("pt-PT", { month: "short", timeZone: "Africa/Luanda" });
const DAY_FORMATTER = new Intl.DateTimeFormat("pt-PT", { day: "2-digit", timeZone: "Africa/Luanda" });
const FULL_DATE_FORMATTER = new Intl.DateTimeFormat("pt-PT", { day: "2-digit", month: "long", year: "numeric", timeZone: "Africa/Luanda" });

function StatusBadge({ status }: { status: EndiamaEvent["status"] }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${EVENT_STATUS_STYLE[status]}`}>
      {EVENT_STATUS_LABEL[status]}
    </span>
  );
}

function DateChip({ isoDate }: { isoDate: string }) {
  const date = new Date(isoDate);
  return (
    <div className="flex flex-col items-center rounded-xl bg-white px-3 py-2 text-center shadow-md">
      <span className="font-heading text-lg font-semibold leading-none text-brand-700">{DAY_FORMATTER.format(date)}</span>
      <span className="text-[10px] font-semibold uppercase text-foreground/50">{MONTH_FORMATTER.format(date)}</span>
    </div>
  );
}

function FeaturedEventCard({ event }: { event: EndiamaEvent }) {
  return (
    <motion.article
      variants={fadeUp}
      className="group relative overflow-hidden rounded-3xl border border-border-subtle bg-surface shadow-sm transition-shadow hover:shadow-xl"
    >
      <div className="relative aspect-[16/10] overflow-hidden sm:aspect-[16/9]">
        <Image
          src={event.imageUrl}
          alt={event.title}
          fill
          priority={false}
          sizes="(max-width: 1024px) 100vw, 60vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
        <div className="absolute left-4 top-4 flex items-center gap-2">
          <StatusBadge status={event.status} />
        </div>
        <div className="absolute right-4 top-4">
          <DateChip isoDate={event.startsAt} />
        </div>

        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
          <h3 className="font-heading text-xl font-medium leading-snug text-white sm:text-2xl lg:text-3xl">{event.title}</h3>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-white/75 sm:text-sm">
            <span className="flex items-center gap-1.5">
              <HiOutlineCalendarDays className="size-4 shrink-0" />
              {FULL_DATE_FORMATTER.format(new Date(event.startsAt))}
            </span>
            {event.startTime ? (
              <span className="flex items-center gap-1.5">
                <HiOutlineClock className="size-4 shrink-0" />
                {event.startTime}
                {event.endTime ? ` – ${event.endTime}` : ""}
              </span>
            ) : null}
            <span className="flex items-center gap-1.5">
              <HiOutlineMapPin className="size-4 shrink-0" />
              <span className="line-clamp-1">{event.location}</span>
            </span>
          </div>
          {event.description ? (
            <p className="mt-3 line-clamp-2 max-w-xl text-sm text-white/70">{event.description}</p>
          ) : null}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              href={`/eventos/${event.slug}`}
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-brand-900 shadow-lg transition-all group-hover:gap-3 hover:shadow-xl"
            >
              Ver detalhes
              <HiOutlineArrowUpRight className="size-4" />
            </Link>
            {event.organizer ? (
              <span className="text-xs text-white/60">Organiza: {event.organizer}</span>
            ) : null}
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function SecondaryEventCard({ event }: { event: EndiamaEvent }) {
  return (
    <motion.article
      variants={fadeUp}
      className="group flex shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-border-subtle bg-surface transition-all hover:-translate-y-1 hover:shadow-lg sm:shrink"
    >
      <Link href={`/eventos/${event.slug}`} className="flex h-full flex-col">
        <div className="relative aspect-[16/10] overflow-hidden">
          <Image
            src={event.imageUrl}
            alt={event.title}
            fill
            sizes="(max-width: 640px) 85vw, (max-width: 1024px) 45vw, 22vw"
            className="object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute left-3 top-3">
            <StatusBadge status={event.status} />
          </div>
        </div>
        <div className="flex flex-1 flex-col p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">
            {FULL_DATE_FORMATTER.format(new Date(event.startsAt))}
          </span>
          <h3 className="mt-1.5 line-clamp-2 font-heading text-sm font-medium leading-snug text-foreground transition-colors group-hover:text-brand-700 dark:group-hover:text-brand-400">
            {event.title}
          </h3>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-foreground/55">
            <HiOutlineMapPin className="size-3.5 shrink-0" />
            <span className="line-clamp-1">{event.location}</span>
          </p>
          {event.capacity ? (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-foreground/45">
              <HiOutlineUserGroup className="size-3.5 shrink-0" />
              {event.capacity} lugares
            </p>
          ) : null}
          <span className="mt-auto flex items-center gap-1 pt-3 text-xs font-medium text-foreground/50 transition-colors group-hover:text-brand-600">
            Ver detalhes
            <HiOutlineArrowUpRight className="size-3.5 shrink-0 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
          </span>
        </div>
      </Link>
    </motion.article>
  );
}

export function EventsSection({
  events,
  showHeader = true,
  viewAllHref,
}: {
  events: EndiamaEvent[];
  showHeader?: boolean;
  viewAllHref?: string;
}) {
  if (events.length === 0) return null;

  const featured = events.find((e) => e.isFeatured) ?? events[0];
  const secondary = events.filter((e) => e.id !== featured.id);

  return (
    <section id="eventos" className="py-20 sm:py-28">
      <Container>
        {showHeader ? <SectionHeader eyebrow="Agenda" title="Eventos" href={viewAllHref} hrefLabel="Ver todos os eventos" /> : null}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <Reveal className="lg:col-span-3" variants={fadeUp}>
            <FeaturedEventCard event={featured} />
          </Reveal>

          {secondary.length > 0 ? (
            <>
              {/* Desktop: stacked secondary cards */}
              <RevealGroup className="hidden grid-cols-1 gap-4 lg:col-span-2 lg:grid xl:grid-cols-2" stagger={0.08}>
                {secondary.slice(0, 4).map((event) => (
                  <SecondaryEventCard key={event.id} event={event} />
                ))}
              </RevealGroup>

              {/* Mobile / tablet: horizontal swipe carousel, no page-level horizontal scroll */}
              <RevealGroup
                className="scrollbar-hide -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 lg:hidden"
                stagger={0.06}
              >
                {secondary.slice(0, 6).map((event) => (
                  <div key={event.id} className="w-[78vw] shrink-0 sm:w-[45vw]">
                    <SecondaryEventCard event={event} />
                  </div>
                ))}
              </RevealGroup>
            </>
          ) : null}
        </div>

        {!showHeader && viewAllHref ? (
          <div className="mt-8 flex justify-center">
            <Link
              href={viewAllHref}
              className="inline-flex items-center gap-2 rounded-full border border-border-subtle px-5 py-2.5 text-sm font-medium text-foreground/70 transition-colors hover:border-brand-500 hover:text-brand-600"
            >
              Ver todos os eventos
              <HiOutlineArrowUpRight className="size-4" />
            </Link>
          </div>
        ) : null}
      </Container>
    </section>
  );
}
