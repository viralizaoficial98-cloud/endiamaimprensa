import type { Clipping, ClippingMediaType } from "../entities/clipping";
import type { Paginated } from "../shared/pagination";

export interface ClippingListParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  mediaType?: ClippingMediaType;
  dateFrom?: string;
  dateTo?: string;
}

export interface ClippingRepository {
  list(params?: ClippingListParams): Promise<Paginated<Clipping>>;
}
