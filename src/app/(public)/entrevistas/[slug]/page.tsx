import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { HiOutlineMicrophone, HiOutlineVideoCamera } from "react-icons/hi2";
import { getInterviewBySlug, getLatestInterviews } from "@/application/use-cases/interview-use-cases";
import { ArticleBody } from "@/presentation/components/article/article-body";
import { CategoryBadge } from "@/presentation/components/ui/category-badge";
import { Container } from "@/presentation/components/ui/container";
import { PublishedAt } from "@/presentation/components/ui/meta";
import { Reveal } from "@/presentation/components/ui/reveal";
import { ShareButton } from "@/presentation/components/ui/share-button";

interface InterviewPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const interviews = await getLatestInterviews(50);
  return interviews.map((interview) => ({ slug: interview.slug }));
}

export async function generateMetadata({ params }: InterviewPageProps): Promise<Metadata> {
  const { slug } = await params;
  const interview = await getInterviewBySlug(slug);
  if (!interview) return {};

  return {
    title: interview.title,
    description: interview.excerpt,
    openGraph: {
      type: "article",
      title: interview.title,
      description: interview.excerpt,
      images: [{ url: interview.coverImage, width: 1600, height: 900, alt: interview.title }],
      publishedTime: interview.publishedAt,
    },
  };
}

export default async function InterviewPage({ params }: InterviewPageProps) {
  const { slug } = await params;
  const interview = await getInterviewBySlug(slug);
  if (!interview) notFound();

  return (
    <div className="pb-24 pt-32 sm:pt-36">
      <div className="relative h-[46vh] min-h-[340px] w-full overflow-hidden">
        <Image src={interview.coverImage} alt={interview.title} fill priority fetchPriority="high" sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
        <Container className="relative z-10 flex h-full flex-col justify-end pb-10">
          <CategoryBadge name={interview.category.name} slug={interview.category.slug} className="w-fit" />
          <h1 className="mt-4 max-w-3xl font-heading text-3xl font-medium leading-tight text-white sm:text-4xl lg:text-5xl">
            {interview.title}
          </h1>
        </Container>
      </div>

      <Container>
        <div className="mx-auto max-w-3xl">
          <Reveal className="mt-8 flex flex-wrap items-center justify-between gap-6 border-b border-border-subtle pb-8">
            <div className="flex items-center gap-4">
              <div className="relative size-14 shrink-0 overflow-hidden rounded-full">
                <Image src={interview.intervieweePhoto} alt={interview.intervieweeName} fill sizes="56px" className="object-cover" />
              </div>
              <div>
                <p className="font-heading text-base font-medium text-foreground">{interview.intervieweeName}</p>
                <p className="text-sm text-foreground/55">
                  {interview.intervieweeRole}
                  {interview.intervieweeCompany ? ` · ${interview.intervieweeCompany}` : ""}
                </p>
                <div className="mt-1 flex items-center gap-3 text-xs text-foreground/45">
                  <PublishedAt iso={interview.publishedAt} />
                  {interview.videoUrl ? <HiOutlineVideoCamera className="size-3.5" aria-label="Com vídeo" /> : null}
                  {interview.audioUrl ? <HiOutlineMicrophone className="size-3.5" aria-label="Com áudio" /> : null}
                </div>
              </div>
            </div>
            <ShareButton title={interview.title} variant="full" />
          </Reveal>

          <div className="mt-10">
            <ArticleBody blocks={interview.blocks} />
          </div>

          {interview.interviewerName ? (
            <Reveal className="mt-10 text-sm text-foreground/50">Entrevista conduzida por {interview.interviewerName}.</Reveal>
          ) : null}
        </div>
      </Container>
    </div>
  );
}
