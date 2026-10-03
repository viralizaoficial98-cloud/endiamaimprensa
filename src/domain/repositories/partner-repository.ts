import type { Partner } from "../entities/partner";

export interface PartnerRepository {
  getAll(): Promise<Partner[]>;
}
