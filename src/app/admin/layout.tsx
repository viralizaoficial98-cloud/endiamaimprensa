import type { Metadata } from "next";

/**
 * Server-side pass-through for every /admin route, only to mark the whole
 * administrative area as non-indexable. Renders nothing of its own: the auth
 * providers and sidebar shell stay in admin/login/layout.tsx and
 * admin/(dashboard)/layout.tsx exactly as before. next.config.ts also sends an
 * X-Robots-Tag header for /admin as a second, header-level safeguard.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
