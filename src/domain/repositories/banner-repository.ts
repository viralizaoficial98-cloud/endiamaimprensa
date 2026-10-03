import type { EndiamaBanner } from "../entities/banner";

export interface BannerRepository {
  getActive(): Promise<EndiamaBanner[]>;
}
