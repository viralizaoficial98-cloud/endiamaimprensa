import { VideoForm } from "@/presentation/admin/video-form";

export default function NewVideoPage() {
  return (
    <div>
      <h1 className="font-heading text-2xl font-medium text-foreground">Novo Vídeo</h1>
      <p className="mt-1 text-sm text-foreground/50">O vídeo será criado em estado de rascunho.</p>
      <div className="mt-8">
        <VideoForm />
      </div>
    </div>
  );
}
