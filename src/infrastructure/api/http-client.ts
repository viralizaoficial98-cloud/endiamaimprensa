const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public errors?: string[]
  ) {
    super(message);
    this.name = "ApiError";
  }
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

interface PaginatedEnvelope<T> {
  success: boolean;
  message?: string;
  data: T[];
  pagination: PaginationMeta;
}

/** Derives a cache tag from `/public/<resource>/...` so a single admin action
 * (e.g. publishing a news article) can invalidate exactly that resource's
 * cached fetches via revalidateTag, instead of waiting out the 60s window —
 * see /api/revalidate and revalidateContentCache(). */
function deriveCacheTag(path: string): string | undefined {
  const segments = path.split("?")[0].split("/").filter(Boolean);
  const publicIndex = segments.indexOf("public");
  const resource = publicIndex >= 0 ? segments[publicIndex + 1] : segments[0];
  return resource || undefined;
}

/** Server Components run this on every request — cache lightly and let callers override via init. */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  const tag = deriveCacheTag(path);
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
      next: { revalidate: 60, ...(tag ? { tags: [tag] } : {}), ...(init as { next?: { revalidate?: number; tags?: string[] } })?.next },
    });
  } catch {
    throw new ApiError("Não foi possível contactar a API do Portal de Notícias.", 0);
  }

  let body: ApiEnvelope<T> | undefined;
  try {
    body = await response.json();
  } catch {
    // no JSON body (e.g. 204)
  }

  if (!response.ok || !body?.success) {
    throw new ApiError(body?.message ?? `Erro ao comunicar com a API (${response.status}).`, response.status, body?.errors);
  }

  return body.data;
}

export async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  return request<T>(path, { ...init, method: "GET" });
}

export async function apiPost<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
  return request<T>(path, { ...init, method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined });
}

export async function apiGetPaginated<T>(path: string, init?: RequestInit): Promise<{ data: T[]; pagination: PaginationMeta }> {
  const tag = deriveCacheTag(path);
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    method: "GET",
    headers: { "Content-Type": "application/json", ...init?.headers },
    next: { revalidate: 60, ...(tag ? { tags: [tag] } : {}) },
  });
  const body = (await response.json()) as PaginatedEnvelope<T>;
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
