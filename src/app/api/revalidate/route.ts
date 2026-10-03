import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

/**
 * On-demand cache invalidation for the public content fetches (which use a
 * 60s time-based `revalidate`, tagged per resource in http-client.ts). The
 * admin panel calls this right after a mutation (publish, update, delete...)
 * so the homepage/public pages never show stale data while waiting out the
 * 60s window — see the caching problem described in the full-stack audit.
 *
 * Not a sensitive endpoint (it can only force a re-fetch, never read/write
 * data), but a shared secret keeps it from being spammed by third parties.
 */
export async function POST(request: Request) {
  const secret = request.headers.get("x-revalidate-secret");
  const expected = process.env.REVALIDATE_SECRET;
  if (expected && secret !== expected) {
    return NextResponse.json({ success: false, message: "Não autorizado." }, { status: 401 });
  }

  let tags: string[] = [];
  try {
    const body = await request.json();
    if (Array.isArray(body?.tags)) tags = body.tags.filter((t: unknown): t is string => typeof t === "string" && t.length > 0);
  } catch {
    return NextResponse.json({ success: false, message: "Corpo do pedido inválido." }, { status: 400 });
  }

  if (tags.length === 0) {
    return NextResponse.json({ success: false, message: "Indique pelo menos uma tag para invalidar." }, { status: 400 });
  }

  for (const tag of tags) revalidateTag(tag);
  return NextResponse.json({ success: true, revalidated: tags });
}
