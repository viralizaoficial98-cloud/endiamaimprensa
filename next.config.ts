import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Derived from env so a production deploy (different domain, HTTPS, no fixed
// LAN IP) never requires touching this file — only NEXT_PUBLIC_BACKEND_URL.
// localhost/127.0.0.1 stay as permanent dev-only fallbacks either way.
function backendRemotePattern() {
  const raw = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return {
      protocol: url.protocol.replace(":", "") as "http" | "https",
      hostname: url.hostname,
      port: url.port || undefined,
      pathname: "/uploads/**" as const,
    };
  } catch {
    return null;
  }
}

const backendPattern = backendRemotePattern();

// Conservative security headers for every response. Deliberately NOT included:
//  - Content-Security-Policy: the portal embeds YouTube/Vimeo, loads media from
//    the backend origin and uses inline JSON-LD; a CSP needs to be trialled in
//    Report-Only mode against the live site first (see docs/seo-auditoria).
//  - HSTS includeSubDomains/preload: other *.endiamaimprensa.com hosts may not
//    all serve HTTPS; enabling those is an infrastructure decision.
const SECURITY_HEADERS = [
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
];

const nextConfig: NextConfig = {
  // Next.js's own self-contained server (next build generates
  // .next/standalone/server.js) — the officially documented, robust way to
  // run an App Router production build on a plain Node host like cPanel's
  // Node Selector, which needs one literal .js "Application Startup File".
  // A hand-written custom server via the public next() API was tried first
  // and failed at runtime under the App Router/RSC webpack runtime in this
  // Next 15 version — this is Next's own generated server, not a
  // reimplementation, so it doesn't hit that gap. public/ and .next/static
  // still need copying into .next/standalone after build — see the
  // "postbuild" npm script.
  output: "standalone",
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: SECURITY_HEADERS },
      // Header-level safeguard on top of the admin layout's noindex metadata.
      { source: "/admin", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
      { source: "/admin/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
      // Static photographs/fallbacks in public/images: cache for a week, then
      // revalidate in the background (files there can be replaced in place,
      // so not "immutable" like /_next/static).
      {
        source: "/images/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }],
      },
    ];
  },
  allowedDevOrigins: ["localhost", "127.0.0.1", ...(backendPattern ? [backendPattern.hostname] : [])],
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 2678400,
    remotePatterns: [
      { protocol: "https", hostname: "i.pravatar.cc" },
      { protocol: "http", hostname: "localhost", port: "4000", pathname: "/uploads/**" },
      { protocol: "http", hostname: "127.0.0.1", port: "4000", pathname: "/uploads/**" },
      ...(backendPattern ? [backendPattern] : []),
      // Automatic YouTube-thumbnail fallback for Video.videoType === "YOUTUBE" when the
      // admin hasn't uploaded a custom thumbnail.
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
      // Historical archive (old WordPress site) — featured images referenced
      // live by URL, never copied into this project's own uploads.
      { protocol: "https", hostname: "endiamaimprensa.com", pathname: "/wp-content/uploads/**" },
    ],
  },
};

export default withNextIntl(nextConfig);
