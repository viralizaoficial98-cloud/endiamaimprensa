"use client";

import { useRef } from "react";
import { HiOutlineChevronLeft, HiOutlineChevronRight } from "react-icons/hi2";
import type { Swiper as SwiperType } from "swiper";
import { Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Video } from "@/domain/entities";
import { Container } from "@/presentation/components/ui/container";
import { SectionHeader } from "@/presentation/components/ui/section-header";
import { Reveal } from "@/presentation/components/ui/reveal";
import { VideoCard } from "@/presentation/components/video/video-card";

import "swiper/css";
import "swiper/css/navigation";

export function VideosSection({ videos }: { videos: Video[] }) {
  const swiperRef = useRef<SwiperType | null>(null);

  return (
    <section className="py-20 sm:py-28">
      <Container>
        <SectionHeader eyebrow="Multimédia" title="Últimos Vídeos" href="/videos" />
        <Reveal>
          <div className="relative">
            <Swiper
              modules={[Navigation]}
              onSwiper={(swiper) => {
                swiperRef.current = swiper;
              }}
              spaceBetween={24}
              slidesPerView={1.15}
              breakpoints={{
                640: { slidesPerView: 2.2 },
                1024: { slidesPerView: 3.2 },
                1280: { slidesPerView: 4 },
              }}
              className="!overflow-visible"
            >
              {videos.map((video) => (
                <SwiperSlide key={video.id}>
                  <VideoCard video={video} />
                </SwiperSlide>
              ))}
            </Swiper>

            <div className="mt-8 flex items-center justify-end gap-3">
              <button
                type="button"
                aria-label="Vídeo anterior"
                onClick={() => swiperRef.current?.slidePrev()}
                className="inline-flex size-10 items-center justify-center rounded-full border border-border-subtle text-foreground/70 transition-colors hover:border-brand-500 hover:text-brand-600"
              >
                <HiOutlineChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                aria-label="Próximo vídeo"
                onClick={() => swiperRef.current?.slideNext()}
                className="inline-flex size-10 items-center justify-center rounded-full border border-border-subtle text-foreground/70 transition-colors hover:border-brand-500 hover:text-brand-600"
              >
                <HiOutlineChevronRight className="size-4" />
              </button>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
