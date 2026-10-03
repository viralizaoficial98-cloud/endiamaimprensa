import type { SocialLink } from "../entities/social-link";

export interface SocialLinkRepository {
  getAll(): Promise<SocialLink[]>;
}
