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
    ],
  },
};

export default withNextIntl(nextConfig);
