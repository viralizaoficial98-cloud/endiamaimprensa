import { apiPost } from "@/infrastructure/api/http-client";

export function subscribeToNewsletter(email: string): Promise<{ email: string }> {
  return apiPost<{ email: string }>("/public/newsletter/subscribe", { email });
}
