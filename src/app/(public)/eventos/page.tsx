import type { Metadata } from "next";
import Link from "next/link";
import { HiOutlineArrowUpRight, HiOutlineCalendarDays, HiOutlineMapPin } from "react-icons/hi2";
import { getArchivedEvents, getUpcomingEvents } from "@/application/use-cases/event-use-cases";
import { EVENT_STATUS_LABEL, EVENT_STATUS_STYLE } from "@/lib/event-status";
import { EventsSection } from "@/presentation/components/home/events-section";
import { Container } from "@/presentation/components/ui/container";
import { Reveal, RevealGroup, RevealItem } from "@/presentation/components/ui/reveal";

export const metadata: Metadata = {
  title: "Eventos",
  description: "Agenda de eventos institucionais da ENDIAMA E.P.",
};

const FULL_DATE_FORMATTER = new Intl.DateTimeFormat("pt-PT", { day: "2-digit", month: "long", year: "numeric", timeZone: "Africa/Luanda" });

export default async function EventosPage() {
  const [events, past] = await Promise.all([
    getUpcomingEvents(60).catch(() => []),
    getArchivedEvents(24).catch(() => []),
  ]);
  const concluded = past.filter((e) => e.status === "FINISHED" || e.status === "CANCELLED");

  return (
    <div className="pb-8 pt-36 sm:pt-40">
      <Container>
        <Reveal className="max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400">Agenda</span>
          <h1 className="mt-3 font-heading text-4xl font-medium tracking-tight text-foreground sm:text-5xl">Eventos</h1>
          <p className="mt-4 text-base text-foreground/60 sm:text-lg">
            Acompanhe os próximos eventos institucionais, fóruns e iniciativas da ENDIAMA E.P.
          </p>
        </Reveal>
      </Container>

      {events.length === 0 ? (
        <Container>
          <p className="py-16 text-center text-sm text-foreground/50">Não existem eventos agendados de momento.</p>
        </Container>
      ) : (
        <EventsSection events={events} showHeader={false} />
      )}

      {concluded.length > 0 ? (
        <Container>
          <div className="mt-4 border-t border-border-subtle pt-14">
            <h2 className="font-heading text-xl font-medium text-foreground">Eventos Anteriores</h2>
            <RevealGroup className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {concluded.map((event) => (
                <RevealItem key={event.id}>
                  <Link
                    href={`/eventos/${event.slug}`}
                    className="group flex items-center justify-between gap-3 rounded-xl border border-border-subtle bg-surface px-4 py-3.5 transition-colors hover:border-brand-500"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase ${EVENT_STATUS_STYLE[event.status]}`}>
                          {EVENT_STATUS_LABEL[event.status]}
                        </span>
                      </div>
                      <p className="mt-1.5 truncate text-sm font-medium text-foreground group-hover:text-brand-600">{event.title}</p>
                      <p className="mt-1 flex items-center gap-3 text-xs text-foreground/50">
                        <span className="flex items-center gap-1">
                          <HiOutlineCalendarDays className="size-3.5" />
                          {FULL_DATE_FORMATTER.format(new Date(event.startsAt))}
                        </span>
                        <span className="flex items-center gap-1 truncate">
                          <HiOutlineMapPin className="size-3.5 shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </span>
                      </p>
                    </div>
                    <HiOutlineArrowUpRight className="size-4 shrink-0 text-foreground/30 transition-colors group-hover:text-brand-600" />
                  </Link>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </Container>
      ) : null}
    </div>
  );
}
