/**
 * Renders a JSON-LD document inside the server-rendered HTML (never injected
 * later by client JS), so crawlers that do not execute JavaScript still see
 * it. "<" is escaped so CMS text can never close the <script> element.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
