"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  HiBolt,
  HiOutlineArrowRightOnRectangle,
  HiOutlineBuildingOffice2,
  HiOutlineCalendarDays,
  HiOutlineDocumentText,
  HiOutlineFolder,
  HiOutlineMusicalNote,
  HiOutlineNewspaper,
  HiOutlinePhoto,
  HiOutlineRectangleGroup,
  HiOutlineSquares2X2,
  HiOutlineUsers,
  HiOutlineVideoCamera,
} from "react-icons/hi2";
import { AdminAuthProvider, useAdminAuth } from "@/presentation/admin/auth-context";
import { ChangePasswordModal } from "@/presentation/admin/change-password-modal";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin/dashboard", icon: HiOutlineSquares2X2, permission: "reports.view" },
  { label: "Notícias", href: "/admin/news", icon: HiOutlineDocumentText, permission: "news.read" },
  { label: "Categorias", href: "/admin/categories", icon: HiOutlineFolder, permission: "categories.manage" },
  { label: "Banners", href: "/admin/banners", icon: HiOutlineRectangleGroup, permission: "banners.manage" },
  { label: "Galerias", href: "/admin/galleries", icon: HiOutlinePhoto, permission: "galleries.manage" },
  { label: "Vídeos", href: "/admin/videos", icon: HiOutlineVideoCamera, permission: "videos.manage" },
  { label: "Documentos", href: "/admin/documents", icon: HiOutlineDocumentText, permission: "documents.manage" },
  { label: "Áudios", href: "/admin/audios", icon: HiOutlineMusicalNote, permission: "audios.manage" },
  { label: "Eventos", href: "/admin/events", icon: HiOutlineCalendarDays, permission: "events.manage" },
  { label: "Parceiros", href: "/admin/partners", icon: HiOutlineBuildingOffice2, permission: "settings.manage" },
  { label: "Clipping", href: "/admin/clipping", icon: HiOutlineNewspaper, permission: "clipping.manage" },
  { label: "Últimas Notícias", href: "/admin/latest-news", icon: HiBolt, permission: "latestnews.manage" },
  { label: "Utilizadores", href: "/admin/users", icon: HiOutlineUsers, permission: "users.read" },
];

/** Protected admin shell (sidebar + auth gate) — scoped to the (dashboard)
 * route group only, so /admin/login never pulls in this chunk (it has its
 * own, independent AdminAuthProvider in app/admin/login/layout.tsx). */
export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <DashboardShell>{children}</DashboardShell>
    </AdminAuthProvider>
  );
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout, hasPermission } = useAdminAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/admin/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-foreground/50">
        A carregar...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-surface-muted">
      <aside className="flex w-64 shrink-0 flex-col border-r border-border-subtle bg-brand-950 text-white">
        <div className="flex h-16 items-center px-5">
          <div className="relative h-9 w-32">
            <Image src="/images/logotipo_endiama.png" alt="ENDIAMA" fill sizes="128px" className="object-contain object-left brightness-0 invert" />
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV_ITEMS.filter((item) => hasPermission(item.permission)).map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon className="size-4.5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-4">
          <p className="truncate text-sm font-medium text-white">{user.name}</p>
          <p className="truncate text-xs text-white/50">{user.role.name}</p>
          <button
            type="button"
            onClick={() => {
              logout();
              router.replace("/admin/login");
            }}
            className="mt-3 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white"
          >
            <HiOutlineArrowRightOnRectangle className="size-4" />
            Terminar sessão
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden">
        {user.mustChangePassword ? (
          <div className="flex items-center justify-between gap-3 bg-gold-500/15 px-6 py-2.5 text-xs font-medium text-gold-700">
            <span>É recomendado alterar a sua senha inicial.</span>
            <button type="button" onClick={() => setChangePasswordOpen(true)} className="shrink-0 rounded-full border border-gold-600/40 px-3 py-1 font-semibold hover:bg-gold-500/20">
              Alterar senha agora
            </button>
          </div>
        ) : null}
        <div className="p-6 sm:p-8">{children}</div>
      </main>

      <ChangePasswordModal open={changePasswordOpen} onClose={() => setChangePasswordOpen(false)} />
    </div>
  );
}
