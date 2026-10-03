import { NewsForm } from "@/presentation/admin/news-form";

export default function NewNewsPage() {
  return (
    <div>
      <h1 className="font-heading text-2xl font-medium text-foreground">Nova Notícia</h1>
      <p className="mt-1 text-sm text-foreground/50">A notícia será criada em estado de rascunho.</p>
      <div className="mt-8">
        <NewsForm />
      </div>
    </div>
  );
}
