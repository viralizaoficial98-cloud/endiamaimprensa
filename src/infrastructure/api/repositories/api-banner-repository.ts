import type { EndiamaBanner } from "@/domain/entities";
import type { BannerRepository } from "@/domain/repositories";
import { apiGet } from "../http-client";
import type { BannerDto } from "../dto";
import { mapBanner } from "../mappers";

export class ApiBannerRepository implements BannerRepository {
  async getActive(): Promise<EndiamaBanner[]> {
    const data = await apiGet<BannerDto[]>("/public/banners");
    return data.map(mapBanner);
  }
}
