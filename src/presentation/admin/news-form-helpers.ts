import { ApiError } from "@/infrastructure/api/http-client";

/** Lightweight flash-message handoff to an admin list page after a redirect — no toast library in the project. */
export function setFlash(message: string) {
  try {
    sessionStorage.setItem("admin_flash", message);
  } catch {
    // sessionStorage indisponível — apenas não mostra a mensagem, sem quebrar o fluxo.
  }
}

export function describeError(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    if (err.errors?.length) return err.errors.join(" ");
    if (err.status === 0) return "Não foi possível comunicar com o servidor.";
    return err.message || fallback;
  }
  return err instanceof Error ? err.message : fallback;
}
