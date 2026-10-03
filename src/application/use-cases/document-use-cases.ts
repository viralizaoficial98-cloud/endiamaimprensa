import type { EndiamaDocument } from "@/domain/entities";
import type { DocumentListParams } from "@/domain/repositories";
import type { Paginated } from "@/domain/shared/pagination";
import { repositories } from "@/infrastructure/di";

export function getLatestDocuments(limit?: number): Promise<EndiamaDocument[]> {
  return repositories.document.getLatest(limit);
}

export function listDocuments(params?: DocumentListParams): Promise<Paginated<EndiamaDocument>> {
  return repositories.document.list(params);
}
