import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  HiOutlineArrowLeft,
  HiOutlineCalendarDays,
  HiOutlineClock,
  HiOutlineEnvelope,
  HiOutlineMapPin,
  HiOutlinePhone,
  HiOutlineUserGroup,
} from "react-icons/hi2";
import { getEventBySlug } from "@/application/use-cases/event-use-cases";
import { EVENT_STATUS_LABEL, EVENT_STATUS_STYLE } from "@/lib/event-status";
import { Container } from "@/presentation/components/ui/container";
import { Reveal } from "@/presentation/components/ui/reveal";

const FULL_DATE_FORMATTER = new Intl.DateTimeFormat("pt-PT", { day: "2-digit", month: "long", year: "numeric", timeZone: "Africa/Luanda" });

interface EventPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug).catch(() => null);
  if (!event) return {};

  return {
    title: event.title,
    description: event.description,
    openGraph: {
      type: "article",
      title: event.title,
      description: event.description,
      images: [{ url: event.imageUrl, width: 1600, height: 900, alt: event.title }],
    },
  };
}

export default async function EventPage({ params }: EventPageProps) {
  const { slug } = await params;
  const event = await getEventBySlug(slug).catch(() => null);
  if (!event) notFound();

  const details = [
    { icon: HiOutlineCalendarDays, label: FULL_DATE_FORMATTER.format(new Date(event.startsAt)) },
    event.startTime ? { icon: HiOutlineClock, label: `${event.startTime}${event.endTime ? ` – ${event.endTime}` : ""}` } : null,
    { icon: HiOutlineMapPin, label: event.address ? `${event.location} — ${event.address}` : event.location },
    event.capacity ? { icon: HiOutlineUserGroup, label: `${event.capacity} lugares` } : null,
    event.contactEmail ? { icon: HiOutlineEnvelope, label: event.contactEmail } : null,
    event.contactPhone ? { icon: HiOutlinePhone, label: event.contactPhone } : null,
  ].filter((d): d is { icon: typeof HiOutlineCalendarDays; label: string } => Boolean(d));

  return (
    <div className="pb-20 pt-32 sm:pt-36">
      <Container>
        <Reveal>
          <Link href="/eventos" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-foreground/60 transition-colors hover:text-brand-600">
            <HiOutlineArrowLeft className="size-4" />
            Voltar aos eventos
          </Link>
        </Reveal>

        <Reveal className="relative aspect-[16/9] w-full overflow-hidden rounded-3xl sm:aspect-[21/9]">
          <Image src={event.imageUrl} alt={event.title} fill priority fetchPriority="high" sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          <span className={`absolute left-5 top-5 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wide ${EVENT_STATUS_STYLE[event.status]}`}>
            {EVENT_STATUS_LABEL[event.status]}
          </span>
        </Reveal>

        <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-3">
          <Reveal className="lg:col-span-2" delay={0.1}>
            <h1 className="font-heading text-3xl font-medium leading-tight text-foreground sm:text-4xl">{event.title}</h1>
            {event.description ? (
              <p className="mt-5 text-base leading-relaxed text-foreground/70">{event.description}</p>
            ) : null}
          </Reveal>

          <Reveal delay={0.2} className="rounded-2xl border border-border-subtle bg-surface p-6">
            <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-foreground/50">Detalhes</h2>
            <ul className="mt-4 space-y-3">
              {details.map((detail, i) => {
                const Icon = detail.icon;
                return (
                  <li key={i} className="flex items-start gap-3 text-sm text-foreground/75">
                    <Icon className="mt-0.5 size-4.5 shrink-0 text-brand-600 dark:text-brand-400" />
                    <span>{detail.label}</span>
                  </li>
                );
              })}
            </ul>
            {event.organizer ? (
              <p className="mt-5 text-xs text-foreground/50">
                Organização: <span className="font-medium text-foreground/70">{event.organizer}</span>
              </p>
            ) : null}
            {event.registrationUrl ? (
              <a
                href={event.registrationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
              >
                Inscrever-se
              </a>
            ) : null}
          </Reveal>
        </div>
      </Container>
    </div>
  );
}
