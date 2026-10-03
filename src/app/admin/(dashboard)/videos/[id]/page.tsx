"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { adminGet } from "@/infrastructure/api/admin-http-client";
import { toDatetimeLocal } from "@/presentation/admin/banner-form";
import { VideoForm, type VideoFormValues } from "@/presentation/admin/video-form";

interface AdminVideoDetail {
  id: string;
  title: string;
  description: string | null;
  categoryId: string;
  authorName: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  isFeatured: boolean;
  publishedAt: string | null;
  thumbnail: string;
  thumbnailAlt: string | null;
  videoType: "UPLOAD" | "YOUTUBE" | "VIMEO" | "EXTERNAL";
  videoUrl: string;
  duration: number;
}

export default function EditVideoPage() {
  const params = useParams<{ id: string }>();
  const [video, setVideo] = useState<AdminVideoDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminGet<AdminVideoDetail>(`/admin/videos/${params.id}`)
      .then(setVideo)
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <p className="text-sm text-foreground/50">A carregar...</p>;
  if (!video) return <p className="text-sm text-red-500">Vídeo não encontrado.</p>;

  const initialValues: VideoFormValues = {
    title: video.title,
    description: video.description ?? "",
    categoryId: video.categoryId,
    authorName: video.authorName ?? "",
    status: video.status,
    isFeatured: video.isFeatured,
    publishedAt: toDatetimeLocal(video.publishedAt ?? ""),
    thumbnail: video.thumbnail,
    thumbnailAlt: video.thumbnailAlt ?? "",
    videoType: video.videoType,
    videoUrl: video.videoUrl,
    duration: video.duration,
  };

  return (
    <div>
      <div>
        <h1 className="font-heading text-2xl font-medium text-foreground">Editar Vídeo</h1>
        <p className="mt-1 text-sm text-foreground/50">Estado actual: {video.status}</p>
      </div>
      <div className="mt-8">
        <VideoForm videoId={video.id} initialValues={initialValues} />
      </div>
    </div>
  );
}
