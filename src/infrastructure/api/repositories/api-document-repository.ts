import type { EndiamaDocument } from "@/domain/entities";
import type { DocumentListParams, DocumentRepository } from "@/domain/repositories";
import type { Paginated } from "@/domain/shared/pagination";
import { apiGet, apiGetPaginated, buildQuery } from "../http-client";
import type { DocumentDto } from "../dto";
import { mapDocument } from "../mappers";

export class ApiDocumentRepository implements DocumentRepository {
  async getLatest(limit = 5): Promise<EndiamaDocument[]> {
    const data = await apiGet<DocumentDto[]>(`/public/documents${buildQuery({ limit })}`);
    return data.map(mapDocument);
  }

  async list(params: DocumentListParams = {}): Promise<Paginated<EndiamaDocument>> {
    const { data, pagination } = await apiGetPaginated<DocumentDto>(
      `/public/documents${buildQuery({ page: params.page, limit: params.limit, search: params.search, category: params.category })}`
    );
    return { data: data.map(mapDocument), pagination };
  }
}
