import type { Author } from "./author";
import type { Category } from "./category";
import type { Tag } from "./tag";

export type NewsFormat = "article" | "infographic" | "report" | "international";

export interface NewsBlockGalleryImage {
  url: string;
  thumbnailUrl?: string;
  alt?: string;
  caption?: string;
}

export type NewsVideoSourceType = "UPLOAD" | "YOUTUBE" | "VIMEO" | "EXTERNAL";

/** "richtext" is the current WYSIWYG content type (sanitized HTML — bold,
 * italic, headings, lists, alignment, quotes, links...). "paragraph" /
 * "heading" / "quote" are kept only so articles saved before the rich-text
 * editor was introduced keep rendering exactly as they always did. */
export interface NewsBlock {
  type: "paragraph" | "heading" | "quote" | "image" | "richtext" | "gallery" | "video" | "audio";
  content?: string;
  caption?: string;
  /** Own alt text for image blocks — distinct from the article's coverImageAlt. */
  alt?: string;
  title?: string;
  images?: NewsBlockGalleryImage[];
  videoType?: NewsVideoSourceType;
  videoUrl?: string;
  audioUrl?: string;
  thumbnailUrl?: string;
}

export interface News {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  excerpt: string;
  blocks: NewsBlock[];
  coverImage: string;
  coverImageAlt: string;
  category: Category;
  author: Author;
  publishedAt: string;
  updatedAt?: string;
  readTimeMinutes: number;
  views: number;
  likes: number;
  tags: Tag[];
  format: NewsFormat;
  isBreaking?: boolean;
  isFeatured?: boolean;
  galleryImages?: string[];
  relatedVideoIds?: string[];
  documentIds?: string[];
}
