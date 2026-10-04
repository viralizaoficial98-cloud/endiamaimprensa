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
 * data), but it still shouldn't be callable by an arbitrary third-party site.
 *
 * Two independent checks, either one is enough:
 *  1. Same-origin: the admin panel calls this from the browser via a plain
 *     relative fetch("/api/revalidate"), so the browser always attaches a
 *     same-origin `Origin` header. A cross-site script cannot forge this —
 *     it would carry ITS OWN origin instead. This is the real protection for
 *     the actual (browser-originated) caller today.
 *  2. Shared secret (`REVALIDATE_SECRET`, server-only env var — never
 *     NEXT_PUBLIC_*): for a hypothetical future non-browser caller (e.g. the
 *     Express backend itself, or a manual ops curl) that has no Origin
 *     header to check. A real secret can only ever protect a server-to-server
 *     call — any value shipped to the browser to send back would be visible
 *     in the client bundle regardless of its env var prefix, so the browser
 *     path is intentionally never given this secret.
 */
// Known production host as a fixed backstop — the cPanel deployment sits
// behind an Apache reverse proxy (see DEPLOY_CPANEL.md) whose exact
// X-Forwarded-Host/Host forwarding behaviour hasn't been verified against
// the live server from here. Without this, a proxy that doesn't forward the
// original Host would make every legitimate same-origin admin call fail the
// check below and silently stop invalidating cache (revalidateContentCache
// is best-effort and swallows errors) — this guarantees that can't happen
// regardless of proxy header quirks, without weakening the check for anyone
// else (a third-party site still cannot forge this exact Origin value).
const KNOWN_PRODUCTION_HOSTS = ["novo.endiamaimprensa.com"];

function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false; // no Origin header -> not a browser call; let the secret check decide.
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    return false;
  }
  if (KNOWN_PRODUCTION_HOSTS.includes(originHost)) return true;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  return host === originHost;
}

export async function POST(request: Request) {
  const secret = request.headers.get("x-revalidate-secret");
  const expected = process.env.REVALIDATE_SECRET;
  const authorizedBySecret = Boolean(expected) && secret === expected;
  const authorizedBySameOrigin = isSameOrigin(request);
  if (!authorizedBySecret && !authorizedBySameOrigin) {
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
