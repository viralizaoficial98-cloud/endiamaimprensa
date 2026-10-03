import type { Clipping } from "@/domain/entities";
import type { ClippingListParams, ClippingRepository } from "@/domain/repositories";
import type { Paginated } from "@/domain/shared/pagination";
import { apiGetPaginated, buildQuery } from "../http-client";
import type { ClippingDto } from "../dto";
import { mapClipping } from "../mappers";

export class ApiClippingRepository implements ClippingRepository {
  async list(params: ClippingListParams = {}): Promise<Paginated<Clipping>> {
    const { data, pagination } = await apiGetPaginated<ClippingDto>(
      `/public/clippings${buildQuery({
        page: params.page,
        limit: params.limit,
        search: params.search,
        category: params.category,
        mediaType: params.mediaType,
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
      })}`
    );
    return { data: data.map(mapClipping), pagination };
  }
}
