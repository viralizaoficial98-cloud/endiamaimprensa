"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { HiOutlineMusicalNote, HiOutlinePhoto, HiOutlineSquares2X2, HiOutlineVideoCamera } from "react-icons/hi2";
import { adminGetPaginated, adminPatch, adminPost, adminUploadFile } from "@/infrastructure/api/admin-http-client";
import { revalidateContentCache } from "@/infrastructure/api/revalidate-client";
import { FlagGB, FlagPT } from "@/presentation/components/layout/flag-icons";
import { describeError, setFlash } from "./news-form-helpers";
import { NewsBlockCard } from "./news-blocks/block-card";
import type { NewsBlockInput, NewsBlockType } from "./news-blocks/types";

export { describeError } from "./news-form-helpers";

interface CategoryOption {
  id: string;
  name: string;
}

type FormLocale = "pt" | "en";

export interface NewsFormValues {
  title: string;
  titleEn: string;
  subtitle: string;
  subtitleEn: string;
  excerpt: string;
  excerptEn: string;
  coverImage: string;
  coverImageAlt: string;
  coverImageAltEn: string;
  categoryId: string;
  format: "article" | "infographic" | "report" | "international";
  isFeatured: boolean;
  isBreaking: boolean;
  /** Datetime-local string. Empty means "use the current date/time when published" —
   * only set this to back-date migrated articles to their original publication date. */
  publishedAt: string;
  blocks: NewsBlockInput[];
  blocksEn: NewsBlockInput[];
}

const EMPTY_VALUES: NewsFormValues = {
  title: "",
  titleEn: "",
  subtitle: "",
  subtitleEn: "",
  excerpt: "",
  excerptEn: "",
  coverImage: "",
  coverImageAlt: "",
  coverImageAltEn: "",
  categoryId: "",
  format: "article",
  isFeatured: false,
  isBreaking: false,
  publishedAt: "",
  blocks: [{ type: "richtext", content: "" }],
  blocksEn: [],
};

/** True if a block actually carries something worth publishing — used both to
 * validate before submit and to decide what gets sent (empty trailing blocks
 * left over from editing are silently dropped, matching prior behaviour). */
function isBlockFilled(block: NewsBlockInput): boolean {
  if (block.type === "richtext") {
    const text = (block.content ?? "").replace(/<[^>]*>/g, "").trim();
    return text.length > 0;
  }
  if (block.type === "gallery") return (block.images?.length ?? 0) > 0;
  if (block.type === "video") return Boolean(block.videoUrl);
  if (block.type === "audio") return Boolean(block.audioUrl);
  if (block.type === "image") return Boolean(block.content);
  return (block.content ?? "").trim().length > 0;
}

const MEDIA_BUTTONS: { type: NewsBlockType; label: string; icon: React.ReactNode }[] = [
  { type: "image", label: "Imagem", icon: <HiOutlinePhoto className="size-4" /> },
  { type: "gallery", label: "Galeria", icon: <HiOutlineSquares2X2 className="size-4" /> },
  { type: "video", label: "Vídeo", icon: <HiOutlineVideoCamera className="size-4" /> },
  { type: "audio", label: "Áudio", icon: <HiOutlineMusicalNote className="size-4" /> },
];

export function NewsForm({
  newsId,
  initialValues,
  initialStatus,
}: {
  newsId?: string;
  initialValues?: NewsFormValues;
  initialStatus?: string;
}) {
  const router = useRouter();
  const [values, setValues] = useState<NewsFormValues>(initialValues ?? EMPTY_VALUES);
  const [lang, setLang] = useState<FormLocale>("pt");
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [pendingCoverFile, setPendingCoverFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState<"draft" | "publish" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminGetPaginated<CategoryOption>("/admin/categories?limit=50").then((res) => setCategories(res.data));
  }, []);

  /** Fixes the exact ordering bug reported: if the cover image is selected
   * before the alt text is filled in, the upload no longer gets stuck —
   * it retries automatically the moment both are present, in either order. */
  useEffect(() => {
    if (!pendingCoverFile || !values.coverImageAlt.trim() || uploading) return;
    const file = pendingCoverFile;
    setUploading(true);
    setError(null);
    adminUploadFile("news", file, values.coverImageAlt)
      .then((result) => {
        setValues((v) => ({ ...v, coverImage: result.url }));
        setPendingCoverFile(null);
      })
      .catch((err) => setError(describeError(err, "Não foi possível carregar a imagem.")))
      .finally(() => setUploading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingCoverFile, values.coverImageAlt]);

  function selectCoverFile(file: File) {
    setError(null);
    setPendingCoverFile(file);
  }

  // Título/Subtítulo/Resumo/Texto alternativo/Conteúdo are the only fields
  // that vary by language — everything else (categoria, imagem física,
  // data, destaque, ...) is structural and shared across PT/EN (spec §19).
  const blocksKey = lang === "pt" ? "blocks" : "blocksEn";
  const currentBlocks = values[blocksKey];

  function setBlocks(updater: (blocks: NewsBlockInput[]) => NewsBlockInput[]) {
    setValues((v) => ({ ...v, [blocksKey]: updater(v[blocksKey]) }));
  }

  function updateBlockAt(index: number, block: NewsBlockInput) {
    setBlocks((blocks) => blocks.map((b, i) => (i === index ? block : b)));
  }

  function removeBlockAt(index: number) {
    if (!window.confirm("Tem certeza que deseja remover este bloco?")) return;
    setBlocks((blocks) => blocks.filter((_, i) => i !== index));
  }

  function moveBlock(index: number, direction: -1 | 1) {
    setBlocks((blocks) => {
      const target = index + direction;
      if (target < 0 || target >= blocks.length) return blocks;
      const next = [...blocks];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function addMediaBlock(type: NewsBlockType) {
    const base: NewsBlockInput = type === "gallery" ? { type, images: [] } : { type };
    setBlocks((blocks) => [...blocks, base]);
  }

  async function handleSubmit(intent: "draft" | "publish") {
    setError(null);

    if (!values.title.trim()) {
      setError("Preencha o título da notícia (Português).");
      setLang("pt");
      return;
    }
    if (!values.excerpt.trim()) {
      setError("Preencha o resumo da notícia (Português).");
      setLang("pt");
      return;
    }
    if (!values.categoryId) {
      setError("Seleccione uma categoria.");
      return;
    }
    if (!values.coverImage) {
      setError(pendingCoverFile ? "Preencha o texto alternativo para concluir o carregamento da imagem de capa." : "Carregue a imagem de capa.");
      return;
    }
    const nonEmptyBlocks = values.blocks.filter(isBlockFilled);
    if (nonEmptyBlocks.length === 0) {
      setError("O conteúdo em Português é obrigatório — escreva o texto ou adicione uma imagem/galeria/vídeo/áudio.");
      setLang("pt");
      return;
    }
    const nonEmptyBlocksEn = values.blocksEn.filter(isBlockFilled);

    setSaving(intent);
    try {
      const payload = {
        title: values.title,
        titleEn: values.titleEn.trim() || undefined,
        subtitle: values.subtitle || undefined,
        subtitleEn: values.subtitleEn.trim() || undefined,
        excerpt: values.excerpt,
        excerptEn: values.excerptEn.trim() || undefined,
        coverImage: values.coverImage,
        coverImageAlt: values.coverImageAlt,
        coverImageAltEn: values.coverImageAltEn.trim() || undefined,
        categoryId: values.categoryId,
        format: values.format,
        isFeatured: values.isFeatured,
        isBreaking: values.isBreaking,
        // Omitted (not explicit null) when left blank — never unintentionally clears an
        // already-set editorial date on an existing article; empty only means "not yet decided."
        publishedAt: values.publishedAt ? new Date(values.publishedAt).toISOString() : undefined,
        content: nonEmptyBlocks,
        contentEn: nonEmptyBlocksEn.length > 0 ? nonEmptyBlocksEn : undefined,
      };

      let id = newsId;
      if (id) {
        await adminPatch(`/admin/news/${id}`, payload);
      } else {
        const createdNews = await adminPost<{ id: string }>("/admin/news", payload);
        id = createdNews.id;
      }

      if (intent === "publish") {
        await adminPost(`/admin/news/${id}/publish`);
        setFlash("Notícia publicada com sucesso.");
      } else {
        setFlash(newsId ? "Alterações guardadas com sucesso." : "Rascunho criado com sucesso.");
      }
      await revalidateContentCache(["news"]);
      router.push("/admin/news");
    } catch (err) {
      setError(describeError(err, "Não foi possível guardar a notícia."));
    } finally {
      setSaving(null);
    }
  }

  const canPublish = initialStatus !== "PUBLISHED";
  const busy = saving !== null;
  const hasEnTitle = Boolean(values.titleEn.trim());

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit("draft");
      }}
      className="max-w-3xl space-y-6"
    >
      <div>
        <label className="mb-1.5 block text-xs font-medium text-foreground/70">Idioma do Conteúdo</label>
        <div className="inline-flex rounded-lg border border-border-subtle p-1">
          <button
            type="button"
            onClick={() => setLang("pt")}
            className={`inline-flex items-center gap-2 rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors ${
              lang === "pt" ? "bg-brand-600 text-white" : "text-foreground/60 hover:text-foreground"
            }`}
          >
            <FlagPT className="h-3 w-4 rounded-[2px]" /> Português
          </button>
          <button
            type="button"
            onClick={() => setLang("en")}
            className={`inline-flex items-center gap-2 rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors ${
              lang === "en" ? "bg-brand-600 text-white" : "text-foreground/60 hover:text-foreground"
            }`}
          >
            <FlagGB className="h-3 w-4 rounded-[2px]" /> English
            {!hasEnTitle ? <span className="rounded-full bg-gold-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-gold-700 dark:text-gold-400">Pendente</span> : null}
          </button>
        </div>
        {lang === "en" ? (
          <p className="mt-1.5 text-xs text-foreground/50">
            Campos em inglês são opcionais. Se ficarem vazios, o site em English mostra automaticamente o conteúdo em Português.
          </p>
        ) : null}
      </div>

      {lang === "pt" ? (
        <>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/70">Título</label>
            <input
              required
              value={values.title}
              onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
              className="w-full rounded-lg border border-border-subtle bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/70">Subtítulo</label>
            <input
              value={values.subtitle}
              onChange={(e) => setValues((v) => ({ ...v, subtitle: e.target.value }))}
              className="w-full rounded-lg border border-border-subtle bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/70">Resumo</label>
            <textarea
              required
              rows={3}
              value={values.excerpt}
              onChange={(e) => setValues((v) => ({ ...v, excerpt: e.target.value }))}
              className="w-full resize-none rounded-lg border border-border-subtle bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-brand-500"
            />
          </div>
        </>
      ) : (
        <>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/70">Title</label>
            <input
              value={values.titleEn}
              onChange={(e) => setValues((v) => ({ ...v, titleEn: e.target.value }))}
              className="w-full rounded-lg border border-border-subtle bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/70">Subtitle</label>
            <input
              value={values.subtitleEn}
              onChange={(e) => setValues((v) => ({ ...v, subtitleEn: e.target.value }))}
              className="w-full rounded-lg border border-border-subtle bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/70">Summary</label>
            <textarea
              rows={3}
              value={values.excerptEn}
              onChange={(e) => setValues((v) => ({ ...v, excerptEn: e.target.value }))}
              className="w-full resize-none rounded-lg border border-border-subtle bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-brand-500"
            />
          </div>
        </>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground/70">Categoria</label>
          <select
            required
            value={values.categoryId}
            onChange={(e) => setValues((v) => ({ ...v, categoryId: e.target.value }))}
            className="w-full rounded-lg border border-border-subtle bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-brand-500"
          >
            <option value="">Seleccione...</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground/70">Formato</label>
          <select
            value={values.format}
            onChange={(e) => setValues((v) => ({ ...v, format: e.target.value as NewsFormValues["format"] }))}
            className="w-full rounded-lg border border-border-subtle bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-brand-500"
          >
            <option value="article">Artigo</option>
            <option value="infographic">Infográfico</option>
            <option value="report">Reportagem</option>
            <option value="international">Internacional</option>
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-foreground/70">Data de Publicação</label>
        <input
          type="datetime-local"
          value={values.publishedAt}
          onChange={(e) => setValues((v) => ({ ...v, publishedAt: e.target.value }))}
          className="w-full max-w-xs rounded-lg border border-border-subtle bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 sm:w-auto"
        />
        <p className="mt-1.5 text-xs text-foreground/50">
          Utilize este campo para definir a data original de publicação da notícia. Esta data determinará a posição
          cronológica da notícia no portal. Deixe em branco para usar a data e hora actuais quando a notícia for publicada.
        </p>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-foreground/70">
          {lang === "pt" ? "Texto alternativo da imagem de capa" : "Cover image alt text (English)"}
        </label>
        <input
          required={lang === "pt"}
          value={lang === "pt" ? values.coverImageAlt : values.coverImageAltEn}
          onChange={(e) =>
            setValues((v) => (lang === "pt" ? { ...v, coverImageAlt: e.target.value } : { ...v, coverImageAltEn: e.target.value }))
          }
          className="w-full rounded-lg border border-border-subtle bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-brand-500"
        />
        {pendingCoverFile && !values.coverImageAlt.trim() ? (
          <p className="mt-1.5 text-xs text-gold-600">
            Imagem seleccionada — o carregamento continua automaticamente assim que preencher o texto alternativo em Português.
          </p>
        ) : null}
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-foreground/70">Imagem de capa (fotografia real)</label>
        <input
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={(e) => e.target.files?.[0] && selectCoverFile(e.target.files[0])}
          className="text-sm"
        />
        {uploading ? <p className="mt-1 text-xs text-foreground/50">A carregar...</p> : null}
        {values.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={values.coverImage} alt={values.coverImageAlt} className="mt-3 h-40 w-full max-w-md rounded-lg object-cover" />
        ) : null}
      </div>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm text-foreground/70">
          <input
            type="checkbox"
            checked={values.isFeatured}
            onChange={(e) => setValues((v) => ({ ...v, isFeatured: e.target.checked }))}
          />
          Destaque
        </label>
        <label className="flex items-center gap-2 text-sm text-foreground/70">
          <input
            type="checkbox"
            checked={values.isBreaking}
            onChange={(e) => setValues((v) => ({ ...v, isBreaking: e.target.checked }))}
          />
          Notícia de última hora
        </label>
      </div>

      <div>
        <label className="mb-2 block text-xs font-medium text-foreground/70">{lang === "pt" ? "Conteúdo" : "Content (English)"}</label>

        {lang === "en" && currentBlocks.length === 0 ? (
          <p className="mb-3 rounded-lg border border-dashed border-border-subtle py-6 text-center text-xs text-foreground/40">
            Ainda sem conteúdo em inglês — opcional. Sem tradução, o artigo mostra o conteúdo em Português quando visto em English.
          </p>
        ) : null}

        <div className="space-y-3">
          {currentBlocks.map((block, index) => (
            <NewsBlockCard
              key={index}
              block={block}
              index={index}
              total={currentBlocks.length}
              onChange={(b) => updateBlockAt(index, b)}
              onRemove={() => removeBlockAt(index)}
              onMove={(dir) => moveBlock(index, dir)}
            />
          ))}
        </div>

        <div className="mt-3">
          <button
            type="button"
            onClick={() => setBlocks((blocks) => [...blocks, { type: "richtext", content: "" }])}
            className="mb-3 text-xs font-medium text-brand-600 hover:underline"
          >
            + Adicionar texto
          </button>
          <p className="mb-1.5 text-xs font-medium text-foreground/70">+ Adicionar conteúdo multimédia</p>
          <div className="flex flex-wrap gap-2">
            {MEDIA_BUTTONS.map((m) => (
              <button
                key={m.type}
                type="button"
                onClick={() => addMediaBlock(m.type)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border-subtle px-3 py-1.5 text-xs font-medium text-foreground/70 transition-colors hover:border-brand-500 hover:text-brand-600"
              >
                {m.icon}
                {m.label}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-[11px] text-foreground/40">Todos os conteúdos multimédia são opcionais.</p>
        </div>
      </div>

      {error ? (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {saving === "draft" ? "A guardar..." : newsId ? "Guardar Alterações" : "Criar Rascunho"}
        </button>
        {canPublish ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => handleSubmit("publish")}
            className="rounded-lg border-2 border-brand-600 px-5 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-600/5 disabled:opacity-50 dark:text-brand-400"
          >
            {saving === "publish" ? "A publicar..." : "Publicar Notícia"}
          </button>
        ) : null}
      </div>
    </form>
  );
}
