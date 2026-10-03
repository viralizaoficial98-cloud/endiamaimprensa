"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { adminGet, adminPost } from "@/infrastructure/api/admin-http-client";
import { revalidateContentCache } from "@/infrastructure/api/revalidate-client";
import { describeError, NewsForm, type NewsFormValues } from "@/presentation/admin/news-form";
import { legacyBlockToRichText, type NewsBlockInput, type NewsBlockType } from "@/presentation/admin/news-blocks/types";
import { toDatetimeLocal } from "@/presentation/admin/banner-form";
import { useAdminAuth } from "@/presentation/admin/auth-context";

type AdminNewsBlockDto = {
  type: string;
  content?: string;
  caption?: string;
  alt?: string;
  title?: string;
  images?: NewsBlockInput["images"];
  videoType?: NewsBlockInput["videoType"];
  videoUrl?: string;
  audioUrl?: string;
  thumbnailUrl?: string;
};

interface AdminNewsDetail {
  id: string;
  title: string;
  titleEn: string | null;
  subtitle: string | null;
  subtitleEn: string | null;
  excerpt: string;
  excerptEn: string | null;
  coverImage: string;
  coverImageAlt: string | null;
  coverImageAltEn: string | null;
  categoryId: string;
  format: string;
  isFeatured: boolean;
  isBreaking: boolean;
  publishedAt: string | null;
  status: string;
  content: AdminNewsBlockDto[];
  contentEn: AdminNewsBlockDto[] | null;
}

const SUPPORTED_TYPES = new Set<NewsBlockType>(["paragraph", "heading", "quote", "image", "richtext", "gallery", "video", "audio"]);

/** Every legacy paragraph/heading/quote block becomes a "richtext" block for
 * editing (same rich editor as new content); image/gallery/video/audio blocks
 * pass through unchanged. The DB row itself is only rewritten if the admin
 * actually saves — opening an old article for viewing never mutates it. */
function toFormBlock(b: AdminNewsBlockDto): NewsBlockInput {
  const type = SUPPORTED_TYPES.has(b.type as NewsBlockType) ? (b.type as NewsBlockType) : "paragraph";
  return legacyBlockToRichText({
    type,
    content: b.content,
    caption: b.caption,
    alt: b.alt,
    title: b.title,
    images: b.images,
    videoType: b.videoType,
    videoUrl: b.videoUrl,
    audioUrl: b.audioUrl,
    thumbnailUrl: b.thumbnailUrl,
  });
}

export default function EditNewsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { hasPermission } = useAdminAuth();
  const [news, setNews] = useState<AdminNewsDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    adminGet<AdminNewsDetail>(`/admin/news/${params.id}`)
      .then(setNews)
      .finally(() => setLoading(false));
  }, [params.id]);

  async function runAction(action: string, body?: unknown) {
    setActionError(null);
    try {
      await adminPost(`/admin/news/${params.id}/${action}`, body);
      await revalidateContentCache(["news"]);
      router.push("/admin/news");
    } catch (err) {
      setActionError(describeError(err, "Falha ao executar a acção."));
    }
  }

  if (loading) return <p className="text-sm text-foreground/50">A carregar...</p>;
  if (!news) return <p className="text-sm text-red-500">Notícia não encontrada.</p>;

  const initialValues: NewsFormValues = {
    title: news.title,
    titleEn: news.titleEn ?? "",
    subtitle: news.subtitle ?? "",
    subtitleEn: news.subtitleEn ?? "",
    excerpt: news.excerpt,
    excerptEn: news.excerptEn ?? "",
    coverImage: news.coverImage,
    coverImageAlt: news.coverImageAlt ?? "",
    coverImageAltEn: news.coverImageAltEn ?? "",
    categoryId: news.categoryId,
    format: (["article", "infographic", "report", "international"].includes(news.format) ? news.format : "article") as NewsFormValues["format"],
    isFeatured: news.isFeatured,
    isBreaking: news.isBreaking,
    publishedAt: toDatetimeLocal(news.publishedAt ?? ""),
    blocks: news.content.length > 0 ? news.content.map(toFormBlock) : [{ type: "richtext", content: "" }],
    blocksEn: (news.contentEn ?? []).map(toFormBlock),
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-medium text-foreground">Editar Notícia</h1>
          <p className="mt-1 text-sm text-foreground/50">Estado actual: {news.status}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {news.status === "DRAFT" ? (
            <WorkflowButton onClick={() => runAction("submit-review")}>Enviar p/ revisão</WorkflowButton>
          ) : null}
          {news.status === "UNDER_REVIEW" && hasPermission("news.approve") ? (
            <>
              <WorkflowButton onClick={() => runAction("approve")}>Aprovar</WorkflowButton>
              <WorkflowButton
                onClick={() => {
                  const reason = window.prompt("Motivo da rejeição:");
                  if (reason) runAction("reject", { reason });
                }}
              >
                Rejeitar
              </WorkflowButton>
            </>
          ) : null}
          {["DRAFT", "APPROVED"].includes(news.status) && hasPermission("news.publish") ? (
            <WorkflowButton onClick={() => runAction("publish")}>Publicar</WorkflowButton>
          ) : null}
          {news.status === "PUBLISHED" && hasPermission("news.publish") ? (
            <>
              <WorkflowButton onClick={() => runAction("unpublish")}>Despublicar</WorkflowButton>
              <WorkflowButton onClick={() => runAction("archive")}>Arquivar</WorkflowButton>
            </>
          ) : null}
        </div>
      </div>

      {actionError ? <p className="mt-3 text-sm text-red-500">{actionError}</p> : null}

      <div className="mt-8">
        <NewsForm newsId={news.id} initialValues={initialValues} initialStatus={news.status} />
      </div>
    </div>
  );
}

function WorkflowButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-border-subtle px-3 py-2 text-xs font-semibold text-foreground/70 transition-colors hover:border-brand-500 hover:text-brand-600"
    >
      {children}
    </button>
  );
}
