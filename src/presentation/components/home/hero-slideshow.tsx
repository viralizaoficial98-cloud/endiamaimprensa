"use client";

import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  HiOutlineArrowUpRight,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineClock,
  HiOutlinePause,
  HiOutlinePlay,
  HiOutlinePlayCircle,
} from "react-icons/hi2";
import type { HeroSlide } from "@/domain/entities";
import { formatDate } from "@/lib/format";
import { AnimatedTitle } from "@/presentation/components/ui/animated-title";
import { DiamondSceneLazy } from "@/presentation/components/three/diamond-scene-lazy";

const SLIDE_DURATION = 7000;

export function HeroSlideshow({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);
  const [progressKey, setProgressKey] = useState(0);
  const containerRef = useRef<HTMLElement>(null);
  const paused = hovering || userPaused || tabHidden;
  /** The very first slide must paint instantly (it's the page's LCP element) —
   * only slide-to-slide transitions after mount should fade/blur. */
  const isFirstMount = useRef(true);
  useEffect(() => {
    isFirstMount.current = false;
  }, []);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 60, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 60, damping: 20 });
  const parallaxX = useTransform(springX, [-0.5, 0.5], [-18, 18]);
  const parallaxY = useTransform(springY, [-0.5, 0.5], [-18, 18]);
  const diamondX = useTransform(springX, [-0.5, 0.5], [-10, 10]);
  const diamondY = useTransform(springY, [-0.5, 0.5], [-10, 10]);

  const goTo = useCallback((next: number) => {
    setIndex((next + slides.length) % slides.length);
    setProgressKey((k) => k + 1);
  }, [slides.length]);

  useEffect(() => {
    if (paused || slides.length <= 1) return;
    const timeout = setTimeout(() => goTo(index + 1), SLIDE_DURATION);
    return () => clearTimeout(timeout);
  }, [index, paused, goTo, slides.length]);

  useEffect(() => {
    function onVisibilityChange() {
      setTabHidden(document.hidden);
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) return;
      if (e.key === "ArrowLeft") goTo(index - 1);
      if (e.key === "ArrowRight") goTo(index + 1);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [index, goTo]);

  function handlePointerMove(e: React.PointerEvent<HTMLElement>) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  if (slides.length === 0) return null;
  const slide = slides[index];
  const secondary = slides.filter((_, i) => i !== index).slice(0, 5);

  return (
    <>
      <section
        ref={containerRef}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onPointerMove={handlePointerMove}
        className="relative h-[88svh] min-h-[560px] w-full overflow-hidden bg-brand-950 sm:min-h-[640px] lg:h-[74vh] lg:max-h-[760px] lg:min-h-[660px]"
      >
        <div className="flex h-full flex-col lg:flex-row">
          {/* Main headline area — ~65-70% */}
          <div className="relative min-h-0 flex-1 overflow-hidden lg:w-[68%] lg:flex-none">
            <AnimatePresence mode="sync">
              <motion.div
                key={slide.id}
                initial={isFirstMount.current ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, filter: "blur(6px)", transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0"
              >
                <motion.div
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1.03 }}
                  transition={{ duration: SLIDE_DURATION / 1000 + 1, ease: "linear" }}
                  style={{ x: parallaxX, y: parallaxY }}
                  className="absolute inset-[-4%]"
                >
                  <Image
                    src={slide.coverImage}
                    alt={slide.coverImageAlt}
                    fill
                    priority={index === 0}
                    fetchPriority={index === 0 ? "high" : undefined}
                    sizes="(min-width: 1024px) 68vw, 100vw"
                    className="object-cover"
                  />
                </motion.div>
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(0deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.15) 55%, rgba(0,0,0,0.2) 100%), " +
                      "linear-gradient(90deg, rgba(2,22,14,0.85) 0%, rgba(2,22,14,0.5) 45%, rgba(2,22,14,0.1) 75%, rgba(2,22,14,0) 100%)",
                  }}
                />
              </motion.div>
            </AnimatePresence>

            {/* Decorative diamond — subtle, partially off-canvas, never competes with the photo */}
            <motion.div
              style={{ x: diamondX, y: diamondY }}
              className="pointer-events-none absolute -right-[6%] -top-[6%] hidden h-[42vh] w-[26vw] max-w-sm opacity-[0.18] mix-blend-screen sm:block lg:right-[-4%]"
            >
              <DiamondSceneLazy className="h-full w-full" />
            </motion.div>

            <div className="relative z-10 flex h-full items-end pb-16 sm:pb-20">
              <div className="w-full px-5 sm:px-8 lg:px-12">
                <div className="max-w-2xl">
                  <AnimatePresence mode="wait">
                    <motion.div key={slide.id} initial="hidden" animate="visible" exit={{ opacity: 0, y: -12, transition: { duration: 0.35 } }}>
                      <motion.div
                        initial={isFirstMount.current ? false : { opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, delay: 0.08 }}
                        className="mb-6 flex flex-wrap items-center gap-3 text-xs font-medium uppercase tracking-[0.18em] text-white/70"
                      >
                        {slide.categoryName ? (
                          <span className="rounded-full bg-brand-600 px-3 py-1 text-white">{slide.categoryName}</span>
                        ) : null}
                        {slide.isFeaturedBadge ? (
                          <span className="rounded-full border border-gold-400/60 px-3 py-1 text-gold-300">Em Destaque</span>
                        ) : null}
                        {slide.publishedAt ? <span>{formatDate(slide.publishedAt)}</span> : null}
                        {slide.readTimeMinutes ? (
                          <span className="inline-flex items-center gap-1">
                            <HiOutlineClock className="size-3.5" />
                            {slide.readTimeMinutes} min
                          </span>
                        ) : null}
                      </motion.div>

                      <AnimatedTitle
                        text={slide.title}
                        delay={0.2}
                        instant={isFirstMount.current}
                        className="font-heading text-3xl font-medium leading-[1.05] text-white sm:text-4xl lg:text-5xl"
                      />

                      {slide.excerpt ? (
                        <motion.p
                          initial={isFirstMount.current ? false : { opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.55, delay: 0.6 }}
                          className="mt-5 max-w-lg text-sm leading-relaxed text-white/80 sm:text-base"
                        >
                          {slide.excerpt}
                        </motion.p>
                      ) : null}

                      <motion.div
                        initial={isFirstMount.current ? false : { opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.8, type: "spring", stiffness: 220, damping: 20 }}
                        className="mt-7 flex flex-wrap items-center gap-3"
                      >
                        <Link href={slide.ctaHref}>
                          <motion.span
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.96 }}
                            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-brand-900 shadow-lg transition-shadow hover:shadow-xl"
                          >
                            {slide.ctaLabel}
                          </motion.span>
                        </Link>
                        {slide.secondaryCtaLabel && slide.secondaryCtaHref ? (
                          <Link href={slide.secondaryCtaHref}>
                            <motion.span
                              whileHover={{ scale: 1.04 }}
                              whileTap={{ scale: 0.96 }}
                              className="inline-flex items-center gap-2 rounded-full border border-white/30 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:border-white hover:bg-white/10"
                            >
                              <HiOutlinePlayCircle className="size-5" />
                              {slide.secondaryCtaLabel}
                            </motion.span>
                          </Link>
                        ) : null}
                      </motion.div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Controls + progress */}
            <div className="absolute inset-x-0 bottom-6 z-10 flex items-center gap-4 px-5 sm:px-8 lg:px-12">
              <button
                type="button"
                aria-label="Slide anterior"
                onClick={() => goTo(index - 1)}
                className="hidden size-9 items-center justify-center rounded-full border border-white/25 text-white transition-colors hover:border-white hover:bg-white/10 sm:inline-flex"
              >
                <HiOutlineChevronLeft className="size-4" />
              </button>

              <div className="flex flex-1 items-center gap-2">
                {slides.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    aria-label={`Ir para o slide ${i + 1}`}
                    onClick={() => goTo(i)}
                    className="group relative h-1.5 flex-1 max-w-16 overflow-hidden rounded-full bg-white/25"
                  >
                    {i === index ? (
                      <motion.span
                        key={progressKey}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: paused ? undefined : 1 }}
                        transition={{ duration: paused ? 0 : SLIDE_DURATION / 1000, ease: "linear" }}
                        className="absolute inset-0 origin-left bg-gold-400"
                      />
                    ) : null}
                  </button>
                ))}
              </div>

              <button
                type="button"
                aria-label={userPaused ? "Retomar slideshow" : "Pausar slideshow"}
                onClick={() => setUserPaused((v) => !v)}
                className="inline-flex size-9 items-center justify-center rounded-full border border-white/25 text-white transition-colors hover:border-white hover:bg-white/10"
              >
                {userPaused ? <HiOutlinePlay className="size-4" /> : <HiOutlinePause className="size-4" />}
              </button>

              <button
                type="button"
                aria-label="Próximo slide"
                onClick={() => goTo(index + 1)}
                className="hidden size-9 items-center justify-center rounded-full border border-white/25 text-white transition-colors hover:border-white hover:bg-white/10 sm:inline-flex"
              >
                <HiOutlineChevronRight className="size-4" />
              </button>
            </div>
          </div>

          {/* Secondary highlights — ~30-35%, desktop only. Integrated into the same Hero via a
              translucent blurred panel instead of a hard border — composition, not cut lines. */}
          {secondary.length > 0 ? (
            <div
              className="hidden shrink-0 gap-1 pb-4 pt-28 backdrop-blur-xl lg:grid lg:w-[32%]"
              style={{
                background: "linear-gradient(180deg, rgba(2,22,14,0.92) 0%, rgba(2,22,14,0.8) 100%)",
                gridTemplateRows: `repeat(${secondary.length}, 1fr)`,
              }}
            >
              {secondary.map((item) => {
                const originalIndex = slides.findIndex((s) => s.id === item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => goTo(originalIndex)}
                    className="group relative mx-3 flex h-full cursor-pointer items-center gap-4 rounded-2xl px-3 py-3 text-left transition-colors duration-300 hover:bg-white/[0.07]"
                  >
                    <span className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl">
                      <Image
                        src={item.coverImage}
                        alt={item.coverImageAlt}
                        fill
                        sizes="96px"
                        className="object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
                      />
                      <span className="absolute inset-0 bg-black/10 transition-colors duration-300 group-hover:bg-black/0" />
                    </span>
                    <span className="min-w-0 flex-1">
                      {item.categoryName ? (
                        <span className="block text-[10px] font-semibold uppercase tracking-wide text-gold-400">{item.categoryName}</span>
                      ) : null}
                      <span className="mt-1 inline-flex items-start gap-1">
                        <span className="line-clamp-2 font-heading text-sm font-medium leading-snug text-white/90 transition-colors duration-300 group-hover:text-white">
                          {item.title}
                        </span>
                        <HiOutlineArrowUpRight className="mt-0.5 size-3.5 shrink-0 -translate-x-1 text-gold-400 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
                      </span>
                      {item.publishedAt ? <span className="mt-1 block text-[11px] text-white/45">{formatDate(item.publishedAt)}</span> : null}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </section>

      {/* Mobile secondary highlights — horizontal carousel below the hero */}
      {secondary.length > 0 ? (
        <div className="scrollbar-hide flex gap-3 overflow-x-auto bg-brand-950 px-5 py-4 lg:hidden">
          {secondary.map((item) => {
            const originalIndex = slides.findIndex((s) => s.id === item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => goTo(originalIndex)}
                className="relative flex w-56 shrink-0 items-center gap-3 overflow-hidden rounded-xl bg-white/5 p-2.5 text-left"
              >
                <span className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg">
                  <Image src={item.coverImage} alt={item.coverImageAlt} fill sizes="64px" className="object-cover" />
                </span>
                <span className="min-w-0 flex-1">
                  {item.categoryName ? (
                    <span className="block text-[9px] font-semibold uppercase tracking-wide text-gold-400">{item.categoryName}</span>
                  ) : null}
                  <span className="line-clamp-2 text-xs font-medium leading-snug text-white/90">{item.title}</span>
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </>
  );
}
