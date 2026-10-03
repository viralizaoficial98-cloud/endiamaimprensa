import Image from "next/image";
import Link from "next/link";
import { HiPlay } from "react-icons/hi2";
import type { Video } from "@/domain/entities";
import { formatDuration } from "@/lib/format";

export function VideoCard({ video }: { video: Video }) {
  return (
    <Link href={`/videos?v=${video.slug}`} className="group block">
      <div className="relative aspect-video overflow-hidden rounded-2xl">
        <Image
          src={video.thumbnailUrl}
          alt={video.title}
          fill
          sizes="(max-width: 768px) 90vw, 25vw"
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-black/25 transition-colors group-hover:bg-black/40" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-white/90 text-brand-700 shadow-lg transition-transform duration-300 group-hover:scale-110">
            <HiPlay className="size-6 translate-x-0.5" />
          </span>
        </div>
        <span className="absolute bottom-3 right-3 rounded-md bg-black/70 px-2 py-1 text-xs font-medium text-white">
          {formatDuration(video.durationSeconds)}
        </span>
      </div>
      <h3 className="mt-3 line-clamp-2 font-heading text-sm font-medium text-foreground transition-colors group-hover:text-brand-600 dark:group-hover:text-brand-400">
        {video.title}
      </h3>
    </Link>
  );
}
