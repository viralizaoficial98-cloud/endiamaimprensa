import type { SocialLink } from "@/domain/entities";
import type { SocialLinkRepository } from "@/domain/repositories";
import { apiGet } from "../http-client";
import type { SocialLinkDto } from "../dto";
import { mapSocialLink } from "../mappers";

export class ApiSocialLinkRepository implements SocialLinkRepository {
  async getAll(): Promise<SocialLink[]> {
    const data = await apiGet<SocialLinkDto[]>("/public/social-links");
    return data.map(mapSocialLink);
  }
}
