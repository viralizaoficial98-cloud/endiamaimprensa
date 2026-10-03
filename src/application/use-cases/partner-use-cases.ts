import type { Partner } from "@/domain/entities";
import { repositories } from "@/infrastructure/di";

export function getAllPartners(): Promise<Partner[]> {
  return repositories.partner.getAll();
}
