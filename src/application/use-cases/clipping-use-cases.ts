import type { Clipping } from "@/domain/entities";
import type { ClippingListParams } from "@/domain/repositories";
import type { Paginated } from "@/domain/shared/pagination";
import { repositories } from "@/infrastructure/di";

export function listClippings(params?: ClippingListParams): Promise<Paginated<Clipping>> {
  return repositories.clipping.list(params);
}
