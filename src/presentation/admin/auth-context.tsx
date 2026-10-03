"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { adminGet, adminPost, clearTokens, getAccessToken, setTokens } from "@/infrastructure/api/admin-http-client";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  username: string;
  avatar: string | null;
  mustChangePassword: boolean;
  role: { id: string; name: string };
  permissions: string[];
}

interface AuthState {
  user: AdminUser | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (code: string) => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getAccessToken()) {
      setLoading(false);
      return;
    }
    adminGet<AdminUser>("/auth/me")
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(identifier: string, password: string) {
    const result = await adminPost<{ user: AdminUser; accessToken: string; refreshToken: string }>("/auth/login", { identifier, password });
    setTokens(result.accessToken, result.refreshToken);
    setUser(result.user);
  }

  async function logout() {
    clearTokens();
    setUser(null);
  }

  function hasPermission(code: string) {
    return Boolean(user?.role.name === "Super Administrador" || user?.permissions.includes(code));
  }

  async function refreshUser() {
    if (!getAccessToken()) return;
    const fresh = await adminGet<AdminUser>("/auth/me").catch(() => null);
    if (fresh) setUser(fresh);
  }

  return <AuthContext.Provider value={{ user, loading, login, logout, hasPermission, refreshUser }}>{children}</AuthContext.Provider>;
}

export function useAdminAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}
