import type { EndiamaDocument } from "../entities/document";
import type { Paginated } from "../shared/pagination";

export interface DocumentListParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
}

export interface DocumentRepository {
  getLatest(limit?: number): Promise<EndiamaDocument[]>;
  list(params?: DocumentListParams): Promise<Paginated<EndiamaDocument>>;
}
