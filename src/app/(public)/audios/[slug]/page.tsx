import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HiOutlineArrowLeft, HiOutlineCalendarDays, HiOutlineMapPin, HiOutlineMicrophone, HiOutlineTicket } from "react-icons/hi2";
import { getAudioBySlug, listAudios } from "@/application/use-cases/audio-use-cases";
import { formatDate } from "@/lib/format";
import { AudioCard } from "@/presentation/components/audio/audio-card";
import { AudioPlayer } from "@/presentation/components/audio/audio-player";
import { Container } from "@/presentation/components/ui/container";
import { Reveal, RevealGroup } from "@/presentation/components/ui/reveal";
import { SectionHeader } from "@/presentation/components/ui/section-header";
import { ShareButton } from "@/presentation/components/ui/share-button";

interface AudioPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: AudioPageProps): Promise<Metadata> {
  const { slug } = await params;
  const audio = await getAudioBySlug(slug).catch(() => null);
  if (!audio) return {};

  return {
    title: audio.title,
    description: audio.description,
    openGraph: {
      type: "article",
      title: audio.title,
      description: audio.description,
      images: [{ url: audio.coverImage, width: 1600, height: 900, alt: audio.title }],
    },
  };
}

export default async function AudioPage({ params }: AudioPageProps) {
  const { slug } = await params;
  const audio = await getAudioBySlug(slug).catch(() => null);
  if (!audio) notFound();

  const { data: pool } = await listAudios({ limit: 12 }).catch(() => ({ data: [], pagination: { page: 1, limit: 12, total: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false } }));
  const related = pool.filter((a) => a.id !== audio.id).slice(0, 3);

  const details = [
    audio.interviewee ? { icon: HiOutlineMicrophone, label: `Entrevistado/Autor: ${audio.interviewee}` } : null,
    audio.location ? { icon: HiOutlineMapPin, label: audio.location } : null,
    audio.relatedEvent ? { icon: HiOutlineTicket, label: audio.relatedEvent.title, href: `/eventos/${audio.relatedEvent.slug}` } : null,
  ].filter((d): d is { icon: typeof HiOutlineMicrophone; label: string; href?: string } => Boolean(d));

  return (
    <div className="pb-20 pt-32 sm:pt-36">
      <Container>
        <Reveal>
          <Link href="/audios" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-foreground/60 transition-colors hover:text-brand-600">
            <HiOutlineArrowLeft className="size-4" />
            Voltar aos áudios
          </Link>
        </Reveal>

        <Reveal className="relative aspect-[16/9] w-full overflow-hidden rounded-3xl sm:aspect-[21/9]">
          <Image src={audio.coverImage} alt={audio.title} fill priority fetchPriority="high" sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          {audio.category ? (
            <span className="absolute left-5 top-5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-brand-700">
              {audio.category.name}
            </span>
          ) : null}
        </Reveal>

        <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Reveal delay={0.1}>
              <div className="flex items-center gap-3 text-xs text-foreground/50">
                <span className="flex items-center gap-1.5">
                  <HiOutlineCalendarDays className="size-4" />
                  {formatDate(audio.publishedAt)}
                </span>
              </div>
              <h1 className="mt-3 font-heading text-3xl font-medium leading-tight text-foreground sm:text-4xl">{audio.title}</h1>
              {audio.description ? <p className="mt-5 text-base leading-relaxed text-foreground/70">{audio.description}</p> : null}
            </Reveal>

            <Reveal delay={0.15} className="mt-6">
              <AudioPlayer
                track={{
                  id: audio.id,
                  slug: audio.slug,
                  title: audio.title,
                  coverImage: audio.coverImage,
                  audioUrl: audio.audioUrl,
                  durationSeconds: audio.durationSeconds,
                }}
              />
            </Reveal>

            <Reveal delay={0.2} className="mt-6">
              <ShareButton title={audio.title} variant="full" />
            </Reveal>
          </div>

          {details.length > 0 ? (
            <Reveal delay={0.2} className="h-fit rounded-2xl border border-border-subtle bg-surface p-6">
              <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-foreground/50">Informações</h2>
              <ul className="mt-4 space-y-3">
                {details.map((detail, i) => {
                  const Icon = detail.icon;
                  const content = (
                    <span className="flex items-start gap-3 text-sm text-foreground/75">
                      <Icon className="mt-0.5 size-4.5 shrink-0 text-brand-600 dark:text-brand-400" />
                      <span>{detail.label}</span>
                    </span>
                  );
                  return <li key={i}>{detail.href ? <Link href={detail.href} className="transition-colors hover:text-brand-600">{content}</Link> : content}</li>;
                })}
              </ul>
            </Reveal>
          ) : null}
        </div>

        {related.length > 0 ? (
          <div className="mt-16 border-t border-border-subtle pt-14">
            <SectionHeader eyebrow="Multimédia" title="Áudios Relacionados" />
            <RevealGroup className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" stagger={0.08}>
              {related.map((item) => (
                <AudioCard key={item.id} audio={item} />
              ))}
            </RevealGroup>
          </div>
        ) : null}
      </Container>
    </div>
  );
}
