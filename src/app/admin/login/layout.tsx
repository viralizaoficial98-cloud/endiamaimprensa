import { AdminAuthProvider } from "@/presentation/admin/auth-context";

/** Own, independent layout for /admin/login — deliberately NOT shared with
 * app/admin/(dashboard)/layout.tsx (the sidebar shell). Sharing a layout
 * between them meant the browser had to fetch that shared chunk before the
 * login form could render at all; keeping login on its own small chunk
 * removes that dependency entirely. */
export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  return <AdminAuthProvider>{children}</AdminAuthProvider>;
}
