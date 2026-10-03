export interface NewsBlockImageInput {
  url: string;
  thumbnailUrl?: string;
  alt?: string;
  caption?: string;
}

export type NewsBlockType = "paragraph" | "heading" | "quote" | "image" | "richtext" | "gallery" | "video" | "audio";

/** Superset covering both the legacy simple blocks (paragraph/heading/quote/
 * image — kept so old articles keep loading and rendering unchanged) and the
 * new richtext/gallery/video/audio blocks. Admins only ever create "richtext"
 * going forward; legacy types are converted to "richtext" on load for editing
 * (see legacyBlockToRichText) but the ORIGINAL stored JSON is left untouched
 * unless the admin actually re-saves. */
export interface NewsBlockInput {
  type: NewsBlockType;
  content?: string;
  caption?: string;
  alt?: string;
  title?: string;
  images?: NewsBlockImageInput[];
  videoType?: "UPLOAD" | "YOUTUBE" | "VIMEO" | "EXTERNAL";
  videoUrl?: string;
  audioUrl?: string;
  thumbnailUrl?: string;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Converts one legacy paragraph/heading/quote block into the HTML a
 * "richtext" block expects, so opening an old article for editing shows it in
 * the same rich editor as new content — without touching the DB until saved.
 * "image" blocks are passed through unchanged (they already have their own
 * dedicated editor UI, nothing to convert). */
export function legacyBlockToRichText(block: NewsBlockInput): NewsBlockInput {
  if (block.type === "paragraph") {
    return { type: "richtext", content: `<p>${escapeHtml(block.content ?? "")}</p>` };
  }
  if (block.type === "heading") {
    return { type: "richtext", content: `<h2>${escapeHtml(block.content ?? "")}</h2>` };
  }
  if (block.type === "quote") {
    const author = block.caption ? `<p>— ${escapeHtml(block.caption)}</p>` : "";
    return { type: "richtext", content: `<blockquote><p>${escapeHtml(block.content ?? "")}</p></blockquote>${author}` };
  }
  return block;
}

export function isLegacyTextBlock(type: NewsBlockType): boolean {
  return type === "paragraph" || type === "heading" || type === "quote";
}
