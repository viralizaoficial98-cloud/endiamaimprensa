import { filterXSS } from "xss";

const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "em",
  "u",
  "s",
  "sup",
  "sub",
  "h2",
  "h3",
  "h4",
  "blockquote",
  "ul",
  "ol",
  "li",
  "a",
  "img",
  "figure",
  "figcaption",
  "code",
  "pre",
  "hr",
];

// Only the block-level tags the WYSIWYG editor's text-align toolbar targets
// get "style" allowed — and only for that one purpose (xss's built-in CSS
// filter still strips anything beyond safe property/value pairs).
const TEXT_ALIGN_TAGS = new Set(["p", "h2", "h3", "h4"]);

/** Strips scripts/event-handlers from any rich-text HTML fragment before persisting or rendering. */
export function sanitizeHtml(input: string): string {
  return filterXSS(input, {
    whiteList: Object.fromEntries(
      ALLOWED_TAGS.map((tag) => [
        tag,
        TEXT_ALIGN_TAGS.has(tag)
          ? ["href", "src", "alt", "title", "class", "target", "rel", "style"]
          : ["href", "src", "alt", "title", "class", "target", "rel"],
      ])
    ),
    stripIgnoreTag: true,
    stripIgnoreTagBody: ["script", "style"],
  });
}

export function sanitizePlainText(input: string): string {
  return filterXSS(input, { whiteList: {}, stripIgnoreTag: true, stripIgnoreTagBody: ["script", "style"] });
}

interface RichBlockImage {
  alt?: unknown;
  caption?: unknown;
  [key: string]: unknown;
}

interface RichBlock {
  type: string;
  content?: unknown;
  caption?: unknown;
  alt?: unknown;
  title?: unknown;
  images?: unknown;
  [key: string]: unknown;
}

function sanitizeBlockImage(image: unknown): unknown {
  if (!image || typeof image !== "object") return image;
  const typed = image as RichBlockImage;
  return {
    ...typed,
    alt: typeof typed.alt === "string" ? sanitizePlainText(typed.alt) : typed.alt,
    caption: typeof typed.caption === "string" ? sanitizePlainText(typed.caption) : typed.caption,
  };
}

/** Recursively sanitizes the text fields of a rich-content JSON block tree.
 * `content` is treated as HTML (rich-text/image-caption-bearing blocks);
 * every other free-text field (caption/alt/title, and each gallery photo's
 * own alt/caption) is treated as plain text — URLs (videoUrl/audioUrl/image
 * urls) are left untouched, they're never rendered as HTML. */
export function sanitizeContentBlocks(blocks: unknown): unknown {
  if (!Array.isArray(blocks)) return blocks;
  return blocks.map((block) => {
    if (!block || typeof block !== "object") return block;
    const typed = block as RichBlock;
    return {
      ...typed,
      content: typeof typed.content === "string" ? sanitizeHtml(typed.content) : typed.content,
      caption: typeof typed.caption === "string" ? sanitizePlainText(typed.caption) : typed.caption,
      alt: typeof typed.alt === "string" ? sanitizePlainText(typed.alt) : typed.alt,
      title: typeof typed.title === "string" ? sanitizePlainText(typed.title) : typed.title,
      images: Array.isArray(typed.images) ? typed.images.map(sanitizeBlockImage) : typed.images,
    };
  });
}
