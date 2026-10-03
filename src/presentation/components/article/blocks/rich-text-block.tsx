/** Renders sanitized HTML produced by the admin's Tiptap editor (see
 * sanitizeHtml on the backend — this content is never trusted blindly, but it
 * IS already stripped of scripts/handlers server-side before it ever reaches
 * here). No Tailwind Typography plugin in this project, so the article's
 * existing type scale is reproduced with scoped selectors instead of prose
 * classes — keeps the same visual identity as the legacy paragraph/heading
 * blocks it replaces. */
export function RichTextBlock({ html }: { html: string }) {
  if (!html || !html.trim() || html === "<p></p>") return null;
  return <div className="news-richtext" dangerouslySetInnerHTML={{ __html: html }} />;
}
