"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { HiOutlineArrowLeft } from "react-icons/hi2";
import { adminGet } from "@/infrastructure/api/admin-http-client";
import { BannerForm, toDatetimeLocal, type BannerFormValues } from "@/presentation/admin/banner-form";

interface AdminBannerDetail {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  image: string;
  imageAlt: string | null;
  mobileImage: string | null;
  videoUrl: string | null;
  categoryId: string | null;
  newsId: string | null;
  tags: Array<{ id: string }>;
  buttonText: string | null;
  buttonUrl: string | null;
  secondaryButtonText: string | null;
  secondaryButtonUrl: string | null;
  textPosition: "LEFT" | "CENTER" | "RIGHT";
  order: number;
  status: "ACTIVE" | "INACTIVE";
  startsAt: string | null;
  endsAt: string | null;
}

export default function EditBannerPage() {
  const params = useParams<{ id: string }>();
  const [banner, setBanner] = useState<AdminBannerDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminGet<AdminBannerDetail>(`/admin/banners/${params.id}`)
      .then(setBanner)
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <p className="text-sm text-foreground/50">A carregar...</p>;
  if (!banner) return <p className="text-sm text-red-500">Banner não encontrado.</p>;

  const initialValues: BannerFormValues = {
    title: banner.title,
    subtitle: banner.subtitle ?? "",
    description: banner.description ?? "",
    image: banner.image,
    imageAlt: banner.imageAlt ?? "",
    mobileImage: banner.mobileImage ?? "",
    videoUrl: banner.videoUrl ?? "",
    categoryId: banner.categoryId ?? "",
    tagIds: banner.tags.map((t) => t.id),
    newsId: banner.newsId ?? "",
    buttonText: banner.buttonText ?? "",
    buttonUrl: banner.buttonUrl ?? "",
    secondaryButtonText: banner.secondaryButtonText ?? "",
    secondaryButtonUrl: banner.secondaryButtonUrl ?? "",
    textPosition: banner.textPosition,
    order: banner.order,
    status: banner.status,
    startsAt: banner.startsAt ? toDatetimeLocal(banner.startsAt) : "",
    endsAt: banner.endsAt ? toDatetimeLocal(banner.endsAt) : "",
  };

  return (
    <div>
      <Link href="/admin/banners" className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-foreground/60 hover:text-brand-600">
        <HiOutlineArrowLeft className="size-3.5" />
        Voltar aos banners
      </Link>
      <h1 className="font-heading text-2xl font-medium text-foreground">Editar Banner</h1>
      <p className="mt-1 text-sm text-foreground/50">{banner.title}</p>
      <div className="mt-8">
        <BannerForm bannerId={banner.id} initialValues={initialValues} />
      </div>
    </div>
  );
}
