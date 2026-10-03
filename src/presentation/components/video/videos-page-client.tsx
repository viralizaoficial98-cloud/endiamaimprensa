"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import type { Video } from "@/domain/entities";
import { PlaylistSidebar } from "./playlist-sidebar";
import { VideoPlayerPremium } from "./video-player-premium";

export function VideosPageClient({ videos }: { videos: Video[] }) {
  const searchParams = useSearchParams();
  const initialSlug = searchParams.get("v");
  const initialVideo = videos.find((v) => v.slug === initialSlug) ?? videos[0];
  const [active, setActive] = useState<Video>(initialVideo);

  const orderedPlaylist = useMemo(() => videos, [videos]);

  if (!active) return null;

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
      <VideoPlayerPremium video={active} />
      <PlaylistSidebar videos={orderedPlaylist} activeId={active.id} onSelect={setActive} />
    </div>
  );
}
