import type { SocialLink } from "@/domain/entities";
import { repositories } from "@/infrastructure/di";

export function getSocialLinks(): Promise<SocialLink[]> {
  return repositories.socialLink.getAll();
}
