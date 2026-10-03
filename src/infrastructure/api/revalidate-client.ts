"use client";

/**
 * Call right after any admin mutation that changes publicly-visible content
 * (news publish/update/delete, etc.) so the homepage and public pages reflect
 * it immediately instead of waiting out the 60s time-based cache — see
 * src/app/api/revalidate/route.ts. Best-effort: never throws, since a failed
 * revalidation shouldn't block the admin action that already succeeded.
 */
export async function revalidateContentCache(tags: string[]): Promise<void> {
  try {
    await fetch("/api/revalidate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tags }),
    });
  } catch {
    // Melhor esforço — a acção administrativa já foi concluída com sucesso.
  }
}
