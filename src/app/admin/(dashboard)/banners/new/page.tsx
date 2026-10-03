import Link from "next/link";
import { HiOutlineArrowLeft } from "react-icons/hi2";
import { BannerForm } from "@/presentation/admin/banner-form";

export default function NewBannerPage() {
  return (
    <div>
      <Link href="/admin/banners" className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-foreground/60 hover:text-brand-600">
        <HiOutlineArrowLeft className="size-3.5" />
        Voltar aos banners
      </Link>
      <h1 className="font-heading text-2xl font-medium text-foreground">Novo Banner</h1>
      <p className="mt-1 text-sm text-foreground/50">Cria um banner para o slideshow principal — com conteúdo próprio ou associado a uma notícia publicada.</p>
      <div className="mt-8">
        <BannerForm />
      </div>
    </div>
  );
}
