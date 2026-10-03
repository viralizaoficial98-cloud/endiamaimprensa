"use client";

import { ApiError } from "./http-client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

const ACCESS_TOKEN_KEY = "endiama_admin_access_token";
const REFRESH_TOKEN_KEY = "endiama_admin_refresh_token";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens(): void {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
}

interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
  errors?: string[];
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      const body = await res.json();
      if (!res.ok || !body.success) return false;
      setTokens(body.data.accessToken, body.data.refreshToken);
      return true;
    } catch {
      return false;
    }
  })();
  const result = await refreshPromise;
  refreshPromise = null;
  return result;
}

async function request<T>(path: string, init: RequestInit = {}, isRetry = false): Promise<T> {
  const token = getAccessToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  // A 401 from the login endpoint itself just means "wrong credentials" — it must
  // reach the caller as a normal rejected promise so the login form can show an
  // inline message, not trigger the "your session expired" refresh-then-redirect
  // flow below (which would hard-navigate back to /admin/login before React ever
  // gets to render that message).
  if (response.status === 401 && !isRetry && path !== "/auth/login") {
    const refreshed = await tryRefresh();
    if (refreshed) return request<T>(path, init, true);
    clearTokens();
    if (typeof window !== "undefined") window.location.href = "/admin/login";
    throw new ApiError("Sessão expirada. Autentique-se novamente.", 401);
  }

  const body = (await response.json().catch(() => undefined)) as ApiEnvelope<T> | undefined;
  if (!response.ok || !body?.success) {
    throw new ApiError(body?.message ?? `Erro ao comunicar com a API (${response.status}).`, response.status, body?.errors);
  }
  return body.data;
}

export function adminGet<T>(path: string): Promise<T> {
  return request<T>(path, { method: "GET" });
}

export function adminPost<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, { method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined });
}

export function adminPatch<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, { method: "PATCH", body: body !== undefined ? JSON.stringify(body) : undefined });
}

export function adminPut<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, { method: "PUT", body: body !== undefined ? JSON.stringify(body) : undefined });
}

export function adminDelete<T>(path: string): Promise<T> {
  return request<T>(path, { method: "DELETE" });
}

export interface UploadResult {
  url: string;
  thumbnailUrl?: string;
  filename: string;
  folder: string;
}

export async function adminUploadFile(folder: string, file: File, altText?: string): Promise<UploadResult> {
  const form = new FormData();
  form.append("file", file);
  if (altText) form.append("altText", altText);

  const token = getAccessToken();
  const response = await fetch(`${API_BASE_URL}/admin/uploads/${folder}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
  });
  const body = await response.json();
  if (!response.ok || !body.success) {
    throw new ApiError(body.message ?? `Erro ao carregar ficheiro (${response.status}).`, response.status, body.errors);
  }
  return body.data;
}

export async function adminGetPaginated<T>(path: string): Promise<{ data: T[]; pagination: PaginationMeta }> {
  const token = getAccessToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  const body = await response.json();
  if (!response.ok || !body.success) {
    throw new ApiError(body.message ?? `Erro ao comunicar com a API (${response.status}).`, response.status);
  }
  return { data: body.data, pagination: body.pagination };
}

export function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}
