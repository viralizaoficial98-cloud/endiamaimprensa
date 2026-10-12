import type { HistoricalNews } from "@/domain/entities";
import type { HistoricalNewsListParams, HistoricalNewsRepository } from "@/domain/repositories";
import type { Paginated } from "@/domain/shared/pagination";
import { apiGetPaginated, buildQuery } from "../http-client";
import type { HistoricalNewsDto } from "../dto";
import { mapHistoricalNews } from "../mappers";

export class ApiHistoricalNewsRepository implements HistoricalNewsRepository {
  async list(params: HistoricalNewsListParams = {}): Promise<Paginated<HistoricalNews>> {
    const { data, pagination } = await apiGetPaginated<HistoricalNewsDto>(
      `/public/historical-archive${buildQuery({
        page: params.page,
        limit: params.limit,
        search: params.search,
        year: params.year,
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
      })}`
    );
    return { data: data.map(mapHistoricalNews), pagination };
  }
}
