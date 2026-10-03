"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { HiOutlineArrowUpRight, HiOutlineVideoCamera } from "react-icons/hi2";
import type { News } from "@/domain/entities";
import { formatDate, formatTime } from "@/lib/format";
import { fadeLeft, fadeUp } from "@/presentation/animations/variants";
import { CategoryBadge } from "@/presentation/components/ui/category-badge";
import { ReadTime, ViewCount } from "@/presentation/components/ui/meta";
import { RevealGroup, RevealItem } from "@/presentation/components/ui/reveal";

export function FeaturedBlock({ main, secondary }: { main: News; secondary: News[] }) {
  return (
    <RevealGroup className="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]" stagger={0.15}>
      <RevealItem variants={fadeUp}>
        <MainStoryCard news={main} />
      </RevealItem>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-1">
        {secondary.map((item) => (
          <RevealItem key={item.id} variants={fadeLeft}>
            <SecondaryStoryCard news={item} />
          </RevealItem>
        ))}
      </div>
    </RevealGroup>
  );
}

function MainStoryCard({ news }: { news: News }) {
  const containerRef = useRef<HTMLElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 80, damping: 24 });
  const springY = useSpring(mouseY, { stiffness: 80, damping: 24 });
  const parallaxX = useTransform(springX, [-0.5, 0.5], [-10, 10]);
  const parallaxY = useTransform(springY, [-0.5, 0.5], [-10, 10]);
  const hasVideo = Boolean(news.relatedVideoIds?.length);

  function handlePointerMove(e: React.PointerEvent<HTMLElement>) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  return (
    <motion.article
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => {
        mouseX.set(0);
        mouseY.set(0);
      }}
      className="group relative flex min-h-[440px] cursor-pointer flex-col justify-end overflow-hidden rounded-3xl shadow-lg"
    >
      <Link href={`/noticia/${news.slug}`} className="absolute inset-0">
        <motion.div style={{ x: parallaxX, y: parallaxY }} className="absolute inset-[-3%]">
          <Image
            src={news.coverImage}
            alt={news.coverImageAlt}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 60vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/5 transition-opacity duration-300 group-hover:from-black/95" />
        {hasVideo ? (
          <span className="absolute right-6 top-6 inline-flex size-12 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
            <HiOutlineVideoCamera className="size-5 text-white" />
          </span>
        ) : null}
      </Link>
      <div className="relative z-10 p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <CategoryBadge name={news.category.name} slug={news.category.slug} size="md" />
          {news.isFeatured ? (
            <span className="rounded-full border border-gold-400/60 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gold-300">
              Destaque
            </span>
          ) : null}
        </div>
        <Link href={`/noticia/${news.slug}`}>
          <h3 className="mt-4 font-heading text-2xl font-medium leading-tight text-white sm:text-3xl lg:text-4xl">{news.title}</h3>
        </Link>
        <p className="mt-3 line-clamp-2 max-w-2xl text-sm text-white/75 sm:text-base">{news.excerpt}</p>
        <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-white/70">
          <span>
            {formatDate(news.publishedAt)} · {formatTime(news.publishedAt)}
          </span>
          <ReadTime minutes={news.readTimeMinutes} />
          <ViewCount views={news.views} />
        </div>
        <Link
          href={`/noticia/${news.slug}`}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-brand-900 shadow-lg transition-all duration-300 hover:gap-3 hover:shadow-xl"
        >
          Ler Notícia
          <HiOutlineArrowUpRight className="size-4" />
        </Link>
      </div>
    </motion.article>
  );
}

function SecondaryStoryCard({ news }: { news: News }) {
  return (
    <article className="group relative flex h-full min-h-[200px] flex-col justify-end overflow-hidden rounded-2xl shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <Link href={`/noticia/${news.slug}`} className="absolute inset-0">
        <Image
          src={news.coverImage}
          alt={news.coverImageAlt}
          fill
          sizes="(max-width: 1024px) 100vw, 32vw"
          className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/5" />
      </Link>
      <div className="relative z-10 p-5">
        <CategoryBadge name={news.category.name} slug={news.category.slug} />
        <Link href={`/noticia/${news.slug}`} className="inline-flex items-start gap-1.5">
          <h4 className="mt-2.5 line-clamp-2 font-heading text-base font-medium leading-snug text-white">{news.title}</h4>
          <HiOutlineArrowUpRight className="mt-2.5 size-3.5 shrink-0 -translate-x-1 text-white opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
        </Link>
        <div className="mt-2 flex items-center gap-3 text-[11px] text-white/70">
          <span>{formatDate(news.publishedAt)}</span>
          <ReadTime minutes={news.readTimeMinutes} className="text-white/70" />
        </div>
      </div>
    </article>
  );
}
