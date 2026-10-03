"use client";

import { useEffect, useMemo, useState } from "react";
import { HiOutlineComputerDesktop, HiOutlineDevicePhoneMobile } from "react-icons/hi2";
import { adminGet, adminGetPaginated, adminPatch, adminPost, adminUploadFile } from "@/infrastructure/api/admin-http-client";
import { revalidateContentCache } from "@/infrastructure/api/revalidate-client";
import { describeError } from "./news-form";
import { useRouter } from "next/navigation";

interface CategoryOption {
  id: string;
  name: string;
}

interface TagOption {
  id: string;
  name: string;
}

interface NewsOption {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  coverImageAlt: string | null;
  status: string;
}

export interface BannerFormValues {
  title: string;
  subtitle: string;
  description: string;
  image: string;
  imageAlt: string;
  mobileImage: string;
  videoUrl: string;
  categoryId: string;
  tagIds: string[];
  newsId: string;
  buttonText: string;
  buttonUrl: string;
  secondaryButtonText: string;
  secondaryButtonUrl: string;
  textPosition: "LEFT" | "CENTER" | "RIGHT";
  order: number;
  status: "ACTIVE" | "INACTIVE";
  startsAt: string;
  endsAt: string;
}

const EMPTY_VALUES: BannerFormValues = {
  title: "",
  subtitle: "",
  description: "",
  image: "",
  imageAlt: "",
  mobileImage: "",
  videoUrl: "",
  categoryId: "",
  tagIds: [],
  newsId: "",
  buttonText: "Ler Notícia",
  buttonUrl: "",
  secondaryButtonText: "",
  secondaryButtonUrl: "",
  textPosition: "LEFT",
  order: 0,
  status: "ACTIVE",
  startsAt: "",
  endsAt: "",
};

function setFlash(message: string) {
  try {
    sessionStorage.setItem("admin_flash", message);
  } catch {
    // sessionStorage indisponível — apenas não mostra a mensagem.
  }
}

/** datetime-local <-> ISO helpers (banner scheduling fields). */
function toDatetimeLocal(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function BannerForm({ bannerId, initialValues }: { bannerId?: string; initialValues?: BannerFormValues }) {
  const router = useRouter();
  const [values, setValues] = useState<BannerFormValues>(initialValues ?? EMPTY_VALUES);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [tags, setTags] = useState<TagOption[]>([]);
  const [newsOptions, setNewsOptions] = useState<NewsOption[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");

  useEffect(() => {
    adminGetPaginated<CategoryOption>("/admin/categories?limit=50").then((res) => setCategories(res.data));
    adminGet<TagOption[]>("/public/tags").catch(() => []).then((res) => setTags(res ?? []));
    adminGetPaginated<NewsOption>("/admin/news?status=PUBLISHED&limit=100").then((res) => setNewsOptions(res.data)).catch(() => {});
  }, []);

  const selectedNews = useMemo(() => newsOptions.find((n) => n.id === values.newsId), [newsOptions, values.newsId]);

  async function handleImageUpload(file: File, field: "image" | "mobileImage") {
    if (!values.imageAlt.trim() && field === "image") {
      setError("Preencha o texto alternativo da imagem antes de a carregar.");
      return;
    }
    const setUploading = field === "image" ? setUploadingImage : setUploadingMobile;
    setUploading(true);
    setError(null);
    try {
      const result = await adminUploadFile("banners", file, values.imageAlt || values.title || "Banner ENDIAMA");
      setValues((v) => ({ ...v, [field]: result.url }));
    } catch (err) {
      setError(describeError(err, "Não foi possível carregar a imagem."));
    } finally {
      setUploading(false);
    }
  }

  function applyNewsContent() {
    if (!selectedNews) return;
    setValues((v) => ({
      ...v,
      title: v.title || selectedNews.title,
      description: v.description || selectedNews.excerpt,
      image: v.image || selectedNews.coverImage,
      imageAlt: v.imageAlt || selectedNews.coverImageAlt || selectedNews.title,
      buttonUrl: v.buttonUrl || `/noticia/${selectedNews.slug}`,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!values.title.trim()) {
      setError("Preencha o título do banner.");
      return;
    }
    if (!values.image) {
      setError("Carregue a imagem do banner.");
      return;
    }
    if (!values.imageAlt.trim()) {
      setError("Preencha o texto alternativo da imagem.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: values.title,
        subtitle: values.subtitle || undefined,
        description: values.description || undefined,
        image: values.image,
        imageAlt: values.imageAlt,
        mobileImage: values.mobileImage || undefined,
        videoUrl: values.videoUrl || undefined,
        categoryId: values.categoryId || undefined,
        tagIds: values.tagIds,
        newsId: values.newsId || undefined,
        buttonText: values.buttonText || undefined,
        buttonUrl: values.buttonUrl || undefined,
        secondaryButtonText: values.secondaryButtonText || undefined,
        secondaryButtonUrl: values.secondaryButtonUrl || undefined,
        textPosition: values.textPosition,
        order: values.order,
        status: values.status,
        startsAt: values.startsAt ? new Date(values.startsAt).toISOString() : null,
        endsAt: values.endsAt ? new Date(values.endsAt).toISOString() : null,
      };

      if (bannerId) {
        await adminPatch(`/admin/banners/${bannerId}`, payload);
        setFlash("Banner actualizado com sucesso.");
      } else {
        await adminPost("/admin/banners", payload);
        setFlash("Banner criado com sucesso.");
      }
      await revalidateContentCache(["banners"]);
      router.push("/admin/banners");
    } catch (err) {
      setError(describeError(err, "Não foi possível guardar o banner."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1fr_420px]">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/70">Título</label>
            <input required value={values.title} onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))} className="w-full rounded-lg border border-border-subtle bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-brand-500" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/70">Subtítulo</label>
            <input value={values.subtitle} onChange={(e) => setValues((v) => ({ ...v, subtitle: e.target.value }))} className="w-full rounded-lg border border-border-subtle bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-brand-500" />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground/70">Resumo</label>
          <textarea rows={3} value={values.description} onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))} className="w-full resize-none rounded-lg border border-border-subtle bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-brand-500" />
        </div>

        <div className="rounded-lg border border-border-subtle p-4">
          <label className="mb-1.5 block text-xs font-medium text-foreground/70">Notícia associada (opcional)</label>
          <select value={values.newsId} onChange={(e) => setValues((v) => ({ ...v, newsId: e.target.value }))} className="w-full rounded-lg border border-border-subtle bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-brand-500">
            <option value="">— Conteúdo personalizado —</option>
            {newsOptions.map((n) => (
              <option key={n.id} value={n.id}>
                {n.title}
              </option>
            ))}
          </select>
          {selectedNews ? (
            <button
              type="button"
              onClick={applyNewsContent}
              className="mt-2 text-xs font-medium text-brand-600 hover:underline"
            >
              Preencher título/resumo/imagem a partir desta notícia
            </button>
          ) : (
            <p className="mt-1.5 text-xs text-foreground/45">
              A notícia original nunca é alterada — associar aqui só liga o banner a ela para o botão &quot;Ler Notícia&quot;.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/70">Categoria</label>
            <select value={values.categoryId} onChange={(e) => setValues((v) => ({ ...v, categoryId: e.target.value }))} className="w-full rounded-lg border border-border-subtle bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-brand-500">
              <option value="">Sem categoria</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/70">Posição do texto</label>
            <select value={values.textPosition} onChange={(e) => setValues((v) => ({ ...v, textPosition: e.target.value as BannerFormValues["textPosition"] }))} className="w-full rounded-lg border border-border-subtle bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-brand-500">
              <option value="LEFT">Esquerda</option>
              <option value="CENTER">Centro</option>
              <option value="RIGHT">Direita</option>
            </select>
          </div>
        </div>

        {tags.length > 0 ? (
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/70">Etiquetas</label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => {
                const active = values.tagIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() =>
                      setValues((v) => ({
                        ...v,
                        tagIds: active ? v.tagIds.filter((id) => id !== tag.id) : [...v.tagIds, tag.id],
                      }))
                    }
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      active ? "border-brand-600 bg-brand-600/10 text-brand-700" : "border-border-subtle text-foreground/60 hover:border-brand-400"
                    }`}
                  >
                    {tag.name}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground/70">Texto alternativo da imagem</label>
          <input required value={values.imageAlt} onChange={(e) => setValues((v) => ({ ...v, imageAlt: e.target.value }))} className="w-full rounded-lg border border-border-subtle bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-brand-500" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/70">Imagem principal (fotografia real)</label>
            <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], "image")} className="text-sm" />
            {uploadingImage ? <p className="mt-1 text-xs text-foreground/50">A carregar...</p> : null}
            {values.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={values.image} alt={values.imageAlt} className="mt-2 h-28 w-full rounded-lg object-cover" />
            ) : null}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/70">Imagem mobile (opcional)</label>
            <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], "mobileImage")} className="text-sm" />
            {uploadingMobile ? <p className="mt-1 text-xs text-foreground/50">A carregar...</p> : null}
            {values.mobileImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={values.mobileImage} alt={values.imageAlt} className="mt-2 h-28 w-full rounded-lg object-cover" />
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/70">Botão principal — texto</label>
            <input value={values.buttonText} onChange={(e) => setValues((v) => ({ ...v, buttonText: e.target.value }))} className="w-full rounded-lg border border-border-subtle bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-brand-500" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/70">Botão principal — URL</label>
            <input value={values.buttonUrl} onChange={(e) => setValues((v) => ({ ...v, buttonUrl: e.target.value }))} placeholder="/noticia/... ou https://..." className="w-full rounded-lg border border-border-subtle bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-brand-500" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/70">Botão secundário — texto (opcional)</label>
            <input value={values.secondaryButtonText} onChange={(e) => setValues((v) => ({ ...v, secondaryButtonText: e.target.value }))} className="w-full rounded-lg border border-border-subtle bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-brand-500" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/70">Botão secundário — URL</label>
            <input value={values.secondaryButtonUrl} onChange={(e) => setValues((v) => ({ ...v, secondaryButtonUrl: e.target.value }))} className="w-full rounded-lg border border-border-subtle bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-brand-500" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/70">Ordem</label>
            <input type="number" value={values.order} onChange={(e) => setValues((v) => ({ ...v, order: Number(e.target.value) }))} className="w-full rounded-lg border border-border-subtle bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-brand-500" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/70">Estado</label>
            <select value={values.status} onChange={(e) => setValues((v) => ({ ...v, status: e.target.value as BannerFormValues["status"] }))} className="w-full rounded-lg border border-border-subtle bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-brand-500">
              <option value="ACTIVE">Activo</option>
              <option value="INACTIVE">Inactivo</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/70">Início da campanha (opcional)</label>
            <input type="datetime-local" value={values.startsAt} onChange={(e) => setValues((v) => ({ ...v, startsAt: e.target.value }))} className="w-full rounded-lg border border-border-subtle bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-brand-500" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/70">Fim da campanha (opcional)</label>
            <input type="datetime-local" value={values.endsAt} onChange={(e) => setValues((v) => ({ ...v, endsAt: e.target.value }))} className="w-full rounded-lg border border-border-subtle bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-brand-500" />
          </div>
        </div>

        {error ? (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
            {error}
          </p>
        ) : null}

        <button type="submit" disabled={saving} className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50">
          {saving ? "A guardar..." : bannerId ? "Guardar Alterações" : "Criar Banner"}
        </button>
      </form>

      <div className="xl:sticky xl:top-6 xl:self-start">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-foreground/50">Pré-visualização</p>
          <div className="flex gap-1 rounded-lg border border-border-subtle p-0.5">
            <button
              type="button"
              onClick={() => setPreviewMode("desktop")}
              aria-label="Pré-visualização desktop"
              className={`rounded-md p-1.5 ${previewMode === "desktop" ? "bg-brand-600 text-white" : "text-foreground/50"}`}
            >
              <HiOutlineComputerDesktop className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode("mobile")}
              aria-label="Pré-visualização mobile"
              className={`rounded-md p-1.5 ${previewMode === "mobile" ? "bg-brand-600 text-white" : "text-foreground/50"}`}
            >
              <HiOutlineDevicePhoneMobile className="size-4" />
            </button>
          </div>
        </div>
        <BannerLivePreview values={values} mode={previewMode} />
      </div>
    </div>
  );
}

function BannerLivePreview({ values, mode }: { values: BannerFormValues; mode: "desktop" | "mobile" }) {
  const image = (mode === "mobile" && values.mobileImage) || values.image;
  const justify = values.textPosition === "CENTER" ? "items-center text-center" : values.textPosition === "RIGHT" ? "items-end text-right" : "items-start text-left";

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-border-subtle bg-brand-950 shadow-sm transition-all ${
        mode === "mobile" ? "mx-auto aspect-[9/16] max-w-[220px]" : "aspect-video w-full"
      }`}
    >
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt={values.imageAlt} className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-white/40">Sem imagem</div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10" />
      <div className={`absolute inset-0 flex flex-col justify-end gap-2 p-4 ${justify}`}>
        <span className="w-fit rounded-full bg-brand-600 px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide text-white">
          {values.subtitle || "ENDIAMA E.P."}
        </span>
        <p className="font-heading text-sm font-medium leading-snug text-white">{values.title || "Título do banner"}</p>
        {values.description ? <p className="line-clamp-2 text-[11px] text-white/70">{values.description}</p> : null}
        <div className="mt-1 flex flex-wrap gap-1.5">
          {values.buttonText ? (
            <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-brand-900">{values.buttonText}</span>
          ) : null}
          {values.secondaryButtonText ? (
            <span className="rounded-full border border-white/40 px-2.5 py-1 text-[10px] font-semibold text-white">{values.secondaryButtonText}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export { toDatetimeLocal };
