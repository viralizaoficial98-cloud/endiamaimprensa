"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { adminGet } from "@/infrastructure/api/admin-http-client";
import { toDatetimeLocal } from "@/presentation/admin/banner-form";
import { GalleryForm, type GalleryFormValues } from "@/presentation/admin/gallery-form";
import { GalleryPhotoManager, type AdminGalleryPhoto } from "@/presentation/admin/gallery-photo-manager";

interface AdminGalleryDetail {
  id: string;
  title: string;
  description: string | null;
  coverImage: string;
  galleryCategoryId: string;
  gallerySubcategoryId: string | null;
  eventDate: string | null;
  location: string | null;
  photographer: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  isFeatured: boolean;
  images: AdminGalleryPhoto[];
}

export default function EditGalleryPage() {
  const params = useParams<{ id: string }>();
  const [gallery, setGallery] = useState<AdminGalleryDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminGet<AdminGalleryDetail>(`/admin/galleries/${params.id}`)
      .then(setGallery)
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <p className="text-sm text-foreground/50">A carregar...</p>;
  if (!gallery) return <p className="text-sm text-red-500">Galeria não encontrada.</p>;

  const initialValues: GalleryFormValues = {
    title: gallery.title,
    description: gallery.description ?? "",
    galleryCategoryId: gallery.galleryCategoryId,
    gallerySubcategoryId: gallery.gallerySubcategoryId ?? "",
    eventDate: toDatetimeLocal(gallery.eventDate ?? ""),
    location: gallery.location ?? "",
    photographer: gallery.photographer ?? "",
    status: gallery.status,
    isFeatured: gallery.isFeatured,
    coverImage: gallery.coverImage,
  };

  return (
    <div>
      <div>
        <h1 className="font-heading text-2xl font-medium text-foreground">Editar Galeria</h1>
        <p className="mt-1 text-sm text-foreground/50">Estado actual: {gallery.status}</p>
      </div>

      <div className="mt-8">
        <GalleryForm galleryId={gallery.id} initialValues={initialValues} />
      </div>

      <div className="mt-10 border-t border-border-subtle pt-8">
        <GalleryPhotoManager
          galleryId={gallery.id}
          galleryTitle={gallery.title}
          initialPhotos={gallery.images}
          initialCoverImage={gallery.coverImage}
        />
      </div>
    </div>
  );
}
