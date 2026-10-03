import type { EndiamaBanner } from "@/domain/entities";
import { repositories } from "@/infrastructure/di";

export function getActiveBanners(): Promise<EndiamaBanner[]> {
  return repositories.banner.getActive();
}
