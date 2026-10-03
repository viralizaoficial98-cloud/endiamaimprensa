"use client";

import { useRouter } from "next/navigation";
import { GalleryForm } from "@/presentation/admin/gallery-form";

export default function NewGalleryPage() {
  const router = useRouter();
  return (
    <div>
      <h1 className="font-heading text-2xl font-medium text-foreground">Nova Galeria</h1>
      <p className="mt-1 text-sm text-foreground/50">
        Preencha os dados da galeria. Depois de criada, poderá adicionar várias fotografias de uma vez.
      </p>
      <div className="mt-8">
        <GalleryForm onCreated={(id) => router.push(`/admin/galleries/${id}`)} />
      </div>
    </div>
  );
}
