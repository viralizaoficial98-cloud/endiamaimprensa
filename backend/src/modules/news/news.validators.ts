import { z } from "zod";

const galleryBlockImageSchema = z.object({
  url: z.string().min(1),
  thumbnailUrl: z.string().optional(),
  alt: z.string().optional(),
  caption: z.string().optional(),
});

// "richtext" is the current WYSIWYG paragraph/heading/list/quote/link content
// (HTML, sanitized server-side — see sanitizeContentBlocks). "paragraph",
// "heading" and "quote" are kept in the enum purely for backward compatibility:
// articles saved before this evolution still validate and render exactly as
// before; the admin editor only ever writes "richtext" for new/re-saved text.
const blockSchema = z.object({
  type: z.enum(["paragraph", "heading", "quote", "list", "link", "image", "video", "gallery", "file", "highlight", "richtext", "audio"]),
  content: z.string().optional(),
  caption: z.string().optional(),
  credit: z.string().optional(),
  // Own alt text for blocks that carry an image — distinct from the article's coverImageAlt.
  alt: z.string().optional(),
  // Gallery block — an ordered set of photos, independent from the cover image.
  images: z.array(galleryBlockImageSchema).optional(),
  // Video block — either an uploaded file (UPLOAD/EXTERNAL: full URL) or an
  // embed (YOUTUBE/VIMEO: just the video id, validated below to keep the
  // embed src the renderer builds free of injection).
  videoType: z.enum(["UPLOAD", "YOUTUBE", "VIMEO", "EXTERNAL"]).optional(),
  videoUrl: z
    .string()
    .optional()
    .refine((v) => !v || /^[A-Za-z0-9_-]{1,64}$|^https?:\/\//.test(v), "URL de vídeo inválida."),
  thumbnailUrl: z.string().optional(),
  // Audio block.
  audioUrl: z.string().optional(),
  title: z.string().optional(),
});

export const createNewsSchema = z.object({
  title: z.string().min(3, "O título é obrigatório."),
  titleEn: z.string().optional(),
  subtitle: z.string().optional(),
  subtitleEn: z.string().optional(),
  excerpt: z.string().min(10, "O resumo é obrigatório."),
  excerptEn: z.string().optional(),
  content: z.array(blockSchema).min(1, "A notícia deve ter pelo menos um bloco de conteúdo."),
  contentEn: z.array(blockSchema).optional(),
  coverImage: z.string().min(1, "A imagem de capa é obrigatória."),
  coverImageAlt: z.string().min(1, "O texto alternativo da imagem é obrigatório."),
  coverImageAltEn: z.string().optional(),
  categoryId: z.string().min(1, "A categoria é obrigatória."),
  // Editorial/original publication date — used for migrating historical articles.
  // Optional: when omitted, publishing falls back to the current date/time.
  publishedAt: z.string().datetime({ message: "Data de publicação inválida." }).optional().nullable(),
  tagIds: z.array(z.string()).optional(),
  format: z.enum(["article", "infographic", "report", "international"]).optional(),
  isFeatured: z.boolean().optional(),
  isBreaking: z.boolean().optional(),
  isHighlighted: z.boolean().optional(),
  allowComments: z.boolean().optional(),
  visibility: z.enum(["PUBLIC", "PRIVATE", "INTERNAL"]).optional(),
  readingTime: z.number().int().positive().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.string().optional(),
  canonicalUrl: z.string().optional(),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImage: z.string().optional(),
  robotsIndex: z.boolean().optional(),
  robotsFollow: z.boolean().optional(),
});

export const updateNewsSchema = createNewsSchema.partial();

export const rejectNewsSchema = z.object({
  reason: z.string().min(3, "Indique o motivo da rejeição."),
});

export const scheduleNewsSchema = z.object({
  scheduledAt: z.string().datetime({ message: "Data de agendamento inválida." }),
});

export type CreateNewsInput = z.infer<typeof createNewsSchema>;
export type UpdateNewsInput = z.infer<typeof updateNewsSchema>;
